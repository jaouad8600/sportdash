export { EB_GROUPS, VLOED_GROUPS, GROUPS_OFFICIAL, normalizeGroup } from "./wk";

/**
 * Client-only storage helpers voor Sportdash.
 * SSR geeft lege defaults; alle browser-API's zitten achter guards.
 */

export type Tide = "eb" | "vloed";

export type CalEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tide: Tide;
  group: string;
  staff?: string[];
};

export type SportMutation = {
  id: string;
  group: string;
  title?: string;
  status?: "open" | "gesloten";
  createdAt?: string;
};

export type Restriction = {
  id: string;
  group: string;
  label: string;
  note?: string;
  active: boolean;
  until?: string;
};

/** Standaard groepen (vul aan naar wens) */
export const GROUPS = [
  "Gaag",
  "Golf",
  "Kust",
  "Lier",
  "Nes",
  "Vliet",
  "Poel",
  "Zijl",
  "Duin",
  "Kade",
  "Kreek",
  "Lei",
  "Rak",
  "Zift",
  "Bron",
  "Burcht",
  "Balk",
];

const K_EVENTS = "rbc-events-v1";
const K_GROUP = "active-group";
const K_SMUT = "sportmutaties-v1";
const K_RESTR = "restrictions-v1";
const K_SRESTR = "sport-restrictions-v1";
const K_VISITS = "visits-v1";
const K_FILES = "files-links-v1";
const K_LOGS = "logs-v1";

export const isBrowser = typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { }
}

/* ===== Events ===== */
export function loadEvents(): CalEvent[] {
  const arr = readJSON<any[]>(K_EVENTS, []);
  return arr.map((e) => ({
    ...e,
    start: new Date(e.start),
    end: new Date(e.end),
  }));
}
export function saveEvents(events: CalEvent[]): void {
  const out = events.map((e) => ({
    ...e,
    start: e.start instanceof Date ? e.start.toISOString() : e.start,
    end: e.end instanceof Date ? e.end.toISOString() : e.end,
  }));
  writeJSON(K_EVENTS, out);
}

/* ===== Actieve groep ===== */
export function getActiveGroup(): string | null {
  const v = readJSON<string | null>(K_GROUP, null);
  return typeof v === "string" ? v : null;
}
export function setActiveGroup(group: string | null): void {
  if (!isBrowser) return;
  if (group == null) {
    try {
      localStorage.removeItem(K_GROUP);
    } catch { }
  } else {
    writeJSON(K_GROUP, group);
  }
}

/* ===== Sportmutaties ===== */
export function loadSportmutaties(): SportMutation[] {
  return readJSON<SportMutation[]>(K_SMUT, []);
}
export function countOpenSportmutaties(): number {
  const all = loadSportmutaties();
  return all.filter((m) => (m.status || "open") !== "gesloten").length;
}

/* ===== Indicaties ===== */
export function loadRestrictions(): Restriction[] {
  return readJSON<Restriction[]>(K_RESTR, []);
}
export function loadSportRestrictions(): Restriction[] {
  return readJSON<Restriction[]>(K_SRESTR, []);
}

/* ===== Visits / Files / Logs ===== */
export type Visit = {
  id: string;
  title: string;
  group: string;
  kind: string;
  date: string;
  start?: string;
  end?: string;
  status: "gepland" | "afgerond" | "geannuleerd";
  note?: string;
};

export function loadVisits(): Visit[] {
  return readJSON<Visit[]>(K_VISITS, []);
}
export function addVisit(visit: any) {
  const visits = loadVisits();
  visits.push(visit);
  writeJSON(K_VISITS, visits);
}
export function saveVisits(visits: any[]) {
  writeJSON(K_VISITS, visits);
}

export function loadFiles(): any[] {
  return readJSON<any[]>(K_FILES, []);
}
export function addFile(file: any) {
  const files = loadFiles();
  files.push(file);
  writeJSON(K_FILES, files);
}
export function saveFiles(files: any[]) {
  writeJSON(K_FILES, files);
}
export function deleteFile(id: string) {
  const files = loadFiles();
  const newFiles = files.filter((f: any) => f.id !== id);
  writeJSON(K_FILES, newFiles);
}

export type LogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  details?: any;
};

export function loadLogs(): LogEntry[] {
  return readJSON<LogEntry[]>(K_LOGS, []);
}

/* ===== Utils ===== */
export function makeEvent(partial: Partial<CalEvent>): CalEvent {
  const id =
    partial.id ||
    (isBrowser && "crypto" in window && (window as any).crypto?.randomUUID
      ? (window as any).crypto.randomUUID()
      : `ev_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  const start =
    partial.start instanceof Date
      ? partial.start
      : new Date(partial.start || Date.now());
  const end =
    partial.end instanceof Date
      ? partial.end
      : new Date(partial.end || Date.now());

  return {
    id,
    title: partial.title || "Sportmoment",
    start,
    end,
    tide: (partial.tide as Tide) || "eb",
    group: partial.group || getActiveGroup() || "Onbekend",
    staff: partial.staff || [],
  };
}
// ===== Groep-states (verkeerslicht) per tide =====
export type GroupState = "groen" | "geel" | "oranje" | "rood" | null;
type GroupStates = {
  eb: Record<string, GroupState>;
  vloed: Record<string, GroupState>;
};
const K_GSTATE = "group-states-v1";

export function loadGroupStates(): GroupStates {
  const def: GroupStates = { eb: {}, vloed: {} };
  const v = readJSON<GroupStates>(K_GSTATE, def);
  return { eb: v?.eb || {}, vloed: v?.vloed || {} };
}
export function saveGroupStates(s: GroupStates) {
  writeJSON(K_GSTATE, s);
}

export function getGroupState(tide: Tide, group: string): GroupState {
  const s = loadGroupStates();
  return (s[tide] as Record<string, GroupState>)[group] ?? null;
}
export function setGroupState(tide: Tide, group: string, state: GroupState) {
  const s = loadGroupStates();
  (s[tide] as Record<string, GroupState>)[group] = state;
  saveGroupStates(s);
}
export function countSturing(tide: Tide): number {
  const s = loadGroupStates();
  return Object.values(s[tide] as Record<string, GroupState>).filter(
    (v) => v === "rood",
  ).length;
}
export const GROUP_STATE_ORDER: GroupState[] = [
  "groen",
  "geel",
  "oranje",
  "rood",
  null,
];
export function nextGroupState(cur: GroupState): GroupState {
  const i = GROUP_STATE_ORDER.indexOf(cur as any);
  const ni = i >= 0 ? (i + 1) % GROUP_STATE_ORDER.length : 0;
  return GROUP_STATE_ORDER[ni];
}
// ===== Officiële groepen + normalisatie =====

function cap1(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
}

/** normaliseer vrije tekst naar officiële groepsnaam, of null voor onbekend/ongewenst */

// ===== Kleurenpalet voor groep-states (uniform in hele app) =====
export const GROUP_STATE_PALETTE: Record<
  Exclude<GroupState, null>,
  {
    bg: string;
    border: string;
    text: string;
    dot: string;
    label: string;
  }
> = {
  groen: {
    bg: "#ecfdf5",
    border: "#22c55e",
    text: "#14532d",
    dot: "#22c55e",
    label: "Groen",
  },
  geel: {
    bg: "#fffbeb",
    border: "#eab308",
    text: "#713f12",
    dot: "#eab308",
    label: "Geel",
  },
  oranje: {
    bg: "#fff7ed",
    border: "#f97316",
    text: "#7c2d12",
    dot: "#f97316",
    label: "Oranje",
  },
  rood: {
    bg: "#fef2f2",
    border: "#ef4444",
    text: "#7f1d1d",
    dot: "#ef4444",
    label: "Rood",
  },
};

/** Haal paletinfo op voor een groep+tide; null indien geen state gezet */
export function getGroupStatePalette(tide: Tide, group: string) {
  const s = getGroupState(tide, group);
  if (!s) return null;
  const p = GROUP_STATE_PALETTE[s];
  return { state: s, ...p };
}
// ===== Helpers =====
export function uniqGroups(list: readonly string[]): string[] {
  // filter falsy en dedup
  return Array.from(new Set((list as readonly string[]).filter(Boolean)));
}
// Tellen per state (per tide)
export function countByState(tide: Tide, state: GroupState): number {
  const s = loadGroupStates();
  return Object.values(s[tide] as Record<string, GroupState>).filter(
    (v) => v === state,
  ).length;
}
// Re-export: één bron van waarheid voor groepslijsten

export function saveLogs(logs: any[]) {
  writeJSON(K_LOGS, logs);
}

export function upsertEvents(events: CalEvent[]) {
  const current = loadEvents();
  const map = new Map(current.map(e => [e.id, e]));
  for (const e of events) {
    map.set(e.id, e);
  }
  saveEvents(Array.from(map.values()));
}
