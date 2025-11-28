"use client";

export type WeekKey = string; // bv. "2025-W37"
type WeekMap = Record<string, number>;           // { [groupId]: count }
type Store = Record<WeekKey, WeekMap>;         // { [weekKey]: WeekMap }

const KEY = "extraSport";

// Fallback-groepen (als er niets in localStorage staat)
const FALLBACK_GROUPS = [
  "Poel", "Lier", "Zijl", "Nes", "Vliet", "Gaag", "Kust", "Golf",
  "Zift", "Lei", "Kade", "Kreek", "Duin", "Rak", "Bron",
];

// Klein hulpfunctietje om een stabiele id te maken uit een naam
function groupIdFromName(name: string) {
  return (name
    .normalize?.("NFD")
    .replace?.(/[\u0300-\u036f]/g, "") ?? name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getGroupsForExtra(): { id: string; name: string }[] {
  try {
    if (typeof window === "undefined") {
      return FALLBACK_GROUPS.map((g) => ({ id: groupIdFromName(g), name: g }));
    }
    // Probeer groepen uit localStorage te halen (indien je ergens anders groepen opslaat)
    const raw = localStorage.getItem("groups");
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) {
        return arr
          .map((x: any) => String(x?.name ?? "").trim())
          .filter(Boolean)
          .map((name: string) => ({ id: groupIdFromName(name), name }));
      }
    }
  } catch { /* negeer en val terug */ }
  // Fallback
  return FALLBACK_GROUPS.map((g) => ({ id: groupIdFromName(g), name: g }));
}

// ---------- Week helpers ----------
export function weekKeyFromDate(d: Date = new Date()): WeekKey {
  // ISO-week (maandag = 1)
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const year = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function dateFromWeekKey(week: WeekKey): Date {
  // Parse "YYYY-Www" → maandag van die week (UTC)
  const m = /^(\d{4})-W(\d{2})$/.exec(String(week));
  const year = m ? Number(m[1]) : new Date().getUTCFullYear();
  const w = m ? Number(m[2]) : 1;
  const simple = new Date(Date.UTC(year, 0, 1 + (w - 1) * 7));
  const dow = simple.getUTCDay() || 7;
  const monday = new Date(simple);
  if (dow <= 4) monday.setUTCDate(simple.getUTCDate() - dow + 1);
  else monday.setUTCDate(simple.getUTCDate() + (8 - dow));
  return monday;
}

export function shiftWeek(week: WeekKey, delta: number): WeekKey {
  const d = dateFromWeekKey(week);
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return weekKeyFromDate(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ---------- Storage ----------
function readStore(): Store {
  try {
    if (typeof window === "undefined") return {};
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    return (data && typeof data === "object") ? data as Store : {};
  } catch {
    return {};
  }
}
function writeStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new CustomEvent("extraSport:changed"));
}

// ---------- API ----------
export function getCounts(week: WeekKey): WeekMap {
  const store = readStore();
  const map = (store[week] ?? {}) as WeekMap;
  return map;
}

export function setCount(groupId: string, value: number, week: WeekKey) {
  const store = readStore();
  const map = (store[week] ?? {}) as WeekMap;
  map[groupId] = Math.max(0, Math.floor(Number(value) || 0));
  store[week] = map;
  writeStore(store);
}

export function inc(groupId: string, delta: number, week: WeekKey) {
  const store = readStore();
  const map = (store[week] ?? {}) as WeekMap;
  const cur = Number(map[groupId] ?? 0);
  map[groupId] = Math.max(0, cur + Number(delta || 0));
  store[week] = map;
  writeStore(store);
}

export function resetWeek(week: WeekKey) {
  const store = readStore();
  store[week] = {};
  writeStore(store);
}

export function onExtraSportChange(cb: () => void) {
  const h = () => cb();
  const s = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener("extraSport:changed", h as EventListener);
  window.addEventListener("storage", s);
  return () => {
    window.removeEventListener("extraSport:changed", h as EventListener);
    window.removeEventListener("storage", s);
  };
}
