import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DB = path.join(process.cwd(), "data", "app-data.json");

export type Kleur = "GREEN" | "YELLOW" | "ORANGE" | "RED";
export type GroepNote = {
  id: string;
  tekst: string;
  auteur?: string;
  createdAt: string;
};
export type Groep = {
  id: string;
  naam: string;
  afdeling: "EB" | "VLOED";
  kleur: Kleur;
  notities: GroepNote[];
};

export type Indicatie = {
  id: string;
  naam: string;
  type?: string;
  status: "open" | "in-behandeling" | "afgerond";
  start?: string;
  eind?: string;
  groepId?: string;
  opmerking?: string;
};

export type Mutatie = {
  id: string;
  titel: string;
  omschrijving?: string;
  status: "open" | "afgehandeld";
  groepId?: string;
  datum?: string; // ISO
};

export type PlanningItem = {
  id: string;
  date: string; // YYYY-MM-DD
  tijd?: string; // HH:mm
  titel: string;
  locatie?: string;
  afdeling?: "EB" | "VLOED";
  groepId?: string;
};

export type Overdracht = {
  id: string;
  van?: string;
  naar?: string;
  titel: string;
  omschrijving?: string;
  datum?: string;
};

type DBShape = {
  groepen: { list: Groep[] };
  indicaties: Indicatie[];
  mutaties: Mutatie[];
  overdrachten: Overdracht[];
  planning: { items: PlanningItem[] };
  materialen?: { id: string; naam: string; aantal: number; categorie?: string }[];
};

const EB = ["Poel", "Lier", "Zijl", "Nes", "Vliet", "Gaag", "Kust", "Golf"];
const VLOED = ["Zift", "Lei", "Kade", "Kreek", "Duin", "Rak", "Bron", "Dijk"];

function seedGroups(): Groep[] {
  const mk = (naam: string, afdeling: "EB" | "VLOED"): Groep => ({
    id: `${afdeling}-${naam}`.toLowerCase(),
    naam,
    afdeling,
    kleur: "GREEN",
    notities: [],
  });
  return [...EB.map((n) => mk(n, "EB")), ...VLOED.map((n) => mk(n, "VLOED"))];
}

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DB);
  } catch {
    const init: DBShape = {
      groepen: { list: seedGroups() },
      indicaties: [],
      mutaties: [],
      overdrachten: [],
      planning: { items: [] },
    };
    await fs.mkdir(path.dirname(DB), { recursive: true });
    await fs.writeFile(DB, JSON.stringify(init, null, 2));
  }
}

async function readDB(): Promise<DBShape> {
  await ensureFile();
  const raw = await fs.readFile(DB, "utf8").catch(() => "{}");
  let j: any;
  try {
    j = JSON.parse(raw || "{}");
  } catch {
    j = {};
  }
  j.groepen = j.groepen ?? {};
  j.groepen.list = Array.isArray(j.groepen.list)
    ? j.groepen.list
    : seedGroups();
  j.indicaties = Array.isArray(j.indicaties) ? j.indicaties : [];
  j.mutaties = Array.isArray(j.mutaties) ? j.mutaties : [];
  j.overdrachten = Array.isArray(j.overdrachten) ? j.overdrachten : [];
  j.planning = j.planning ?? {};
  j.planning.items = Array.isArray(j.planning.items) ? j.planning.items : [];
  return j as DBShape;
}

async function writeDB(db: DBShape): Promise<void> {
  await fs.writeFile(DB, JSON.stringify(db, null, 2));
}

/* ===== Groepen ===== */
export async function listGroepen(): Promise<Groep[]> {
  const db = await readDB();
  return db.groepen.list;
}
export async function getRodeGroepen(): Promise<Groep[]> {
  const list = await listGroepen();
  return list.filter((g) => g.kleur === "RED");
}
export async function updateGroepKleur(
  id: string,
  kleur: Kleur,
): Promise<Groep> {
  const db = await readDB();
  const g = db.groepen.list.find((x) => x.id === id);
  if (!g) throw new Error("groep niet gevonden");
  g.kleur = kleur;
  await writeDB(db);
  return g;
}
export async function addGroepNotitie(
  groepId: string,
  tekst: string,
  auteur?: string,
): Promise<Groep> {
  const db = await readDB();
  const g = db.groepen.list.find((x) => x.id === groepId);
  if (!g) throw new Error("groep niet gevonden");
  g.notities.unshift({
    id: randomUUID(),
    tekst,
    auteur,
    createdAt: new Date().toISOString(),
  });
  await writeDB(db);
  return g;
}

export async function deleteNote(groepId: string, noteId: string): Promise<void> {
  const db = await readDB();
  const g = db.groepen.list.find((x) => x.id === groepId);
  if (!g) throw new Error("groep niet gevonden");
  g.notities = g.notities.filter((n) => n.id !== noteId);
  await writeDB(db);
}

/* ===== Indicaties ===== */
export async function listIndicaties(): Promise<Indicatie[]> {
  const db = await readDB();
  return db.indicaties;
}
export async function addIndicatie(
  inp: Partial<Indicatie>,
): Promise<Indicatie> {
  if (!inp.naam) throw new Error("naam verplicht");
  const db = await readDB();
  const rec: Indicatie = {
    id: randomUUID(),
    naam: inp.naam!,
    type: inp.type ?? "",
    status: inp.status ?? "open",
    start: inp.start ?? "",
    eind: inp.eind ?? "",
    groepId: inp.groepId ?? "",
    opmerking: inp.opmerking ?? "",
  };
  db.indicaties.unshift(rec);
  await writeDB(db);
  return rec;
}
export async function updateIndicatie(
  id: string,
  patch: Partial<Indicatie>,
): Promise<Indicatie> {
  const db = await readDB();
  const i = db.indicaties.find((x) => x.id === id);
  if (!i) throw new Error("indicatie niet gevonden");
  Object.assign(i, patch);
  await writeDB(db);
  return i;
}
export async function removeIndicatie(id: string): Promise<void> {
  const db = await readDB();
  db.indicaties = db.indicaties.filter((x) => x.id !== id);
  await writeDB(db);
}
export async function getIndicatiesSummary() {
  const list = await listIndicaties();
  const open = list.filter((x) => x.status === "open").length;
  const inBehandeling = list.filter(
    (x) => x.status === "in-behandeling",
  ).length;
  const afgerond = list.filter((x) => x.status === "afgerond").length;
  return { open, inBehandeling, afgerond, totaal: list.length };
}

/* ===== Mutaties ===== */
export async function listMutaties(): Promise<Mutatie[]> {
  const db = await readDB();
  return db.mutaties;
}
export async function addMutatie(inp: Partial<Mutatie>): Promise<Mutatie> {
  if (!inp.titel) throw new Error("titel verplicht");
  const db = await readDB();
  const rec: Mutatie = {
    id: randomUUID(),
    titel: inp.titel!,
    omschrijving: inp.omschrijving ?? "",
    status: inp.status ?? "open",
    groepId: inp.groepId ?? "",
    datum: inp.datum ?? new Date().toISOString(),
  };
  db.mutaties.unshift(rec);
  await writeDB(db);
  return rec;
}
export async function updateMutatie(
  id: string,
  patch: Partial<Mutatie>,
): Promise<Mutatie> {
  const db = await readDB();
  const m = db.mutaties.find((x) => x.id === id);
  if (!m) throw new Error("mutatie niet gevonden");
  Object.assign(m, patch);
  await writeDB(db);
  return m;
}
export async function removeMutatie(id: string): Promise<void> {
  const db = await readDB();
  db.mutaties = db.mutaties.filter((x) => x.id !== id);
  await writeDB(db);
}
export async function getMutatiesSummary() {
  const list = await listMutaties();
  const open = list.filter((x) => x.status === "open").length;
  return { open, totaal: list.length };
}

/* ===== Planning ===== */
export async function listPlanningByDate(
  date: string,
): Promise<PlanningItem[]> {
  const db = await readDB();
  return db.planning.items.filter((x) => x.date === date);
}
export async function getPlanningItem(id: string): Promise<PlanningItem | undefined> {
  const db = await readDB();
  return db.planning.items.find((x) => x.id === id);
}
export async function addPlanning(
  inp: Partial<PlanningItem>,
): Promise<PlanningItem> {
  if (!inp.date || !inp.titel) throw new Error("date en titel verplicht");
  const db = await readDB();
  const rec: PlanningItem = {
    id: randomUUID(),
    date: inp.date!,
    tijd: inp.tijd ?? "",
    titel: inp.titel!,
    locatie: inp.locatie ?? "",
    afdeling: inp.afdeling ?? undefined,
    groepId: inp.groepId ?? undefined,
  };
  db.planning.items.push(rec);
  await writeDB(db);
  return rec;
}
export async function updatePlanning(
  id: string,
  patch: Partial<PlanningItem>,
): Promise<PlanningItem> {
  const db = await readDB();
  const it = db.planning.items.find((x) => x.id === id);
  if (!it) throw new Error("planning item niet gevonden");
  Object.assign(it, patch);
  await writeDB(db);
  return it;
}
export async function removePlanning(id: string): Promise<void> {
  const db = await readDB();
  db.planning.items = db.planning.items.filter((x) => x.id !== id);
  await writeDB(db);
}

/* ===== Overdrachten (basic) ===== */
export async function listOverdrachten(): Promise<Overdracht[]> {
  const db = await readDB();
  return db.overdrachten;
}
export async function addOverdracht(
  inp: Partial<Overdracht>,
): Promise<Overdracht> {
  if (!inp.titel) throw new Error("titel verplicht");
  const db = await readDB();
  const rec: Overdracht = {
    id: randomUUID(),
    titel: inp.titel!,
    omschrijving: inp.omschrijving ?? "",
    van: inp.van ?? "",
    naar: inp.naar ?? "",
    datum: inp.datum ?? new Date().toISOString(),
  };
  db.overdrachten.unshift(rec);
  await writeDB(db);
  return rec;
}
export async function updateOverdracht(
  id: string,
  patch: Partial<Overdracht>,
): Promise<Overdracht> {
  const db = await readDB();
  const x = db.overdrachten.find((o) => o.id === id);
  if (!x) throw new Error("overdracht niet gevonden");
  Object.assign(x, patch);
  await writeDB(db);
  return x;
}
export async function removeOverdracht(id: string): Promise<void> {
  const db = await readDB();
  db.overdrachten = db.overdrachten.filter((x) => x.id !== id);
  await writeDB(db);
}

/* ===== Materialen ===== */
export type Materiaal = {
  id: string;
  naam: string;
  aantal: number;
  categorie?: string;
};

export async function listMaterialen(): Promise<Materiaal[]> {
  const db = await readDB();
  return db.materialen || [];
}

export async function addMateriaal(inp: Partial<Materiaal>): Promise<Materiaal> {
  const db = await readDB();
  const rec: Materiaal = {
    id: randomUUID(),
    naam: inp.naam || "Naamloos",
    aantal: inp.aantal || 0,
    categorie: inp.categorie,
  };
  db.materialen = db.materialen || [];
  db.materialen.push(rec);
  await writeDB(db);
  return rec;
}

export async function updateMateriaal(id: string, patch: Partial<Materiaal>): Promise<Materiaal> {
  const db = await readDB();
  db.materialen = db.materialen || [];
  const m = db.materialen.find(x => x.id === id);
  if (!m) throw new Error("Materiaal niet gevonden");
  Object.assign(m, patch);
  await writeDB(db);
  return m;
}

export async function deleteMateriaal(id: string): Promise<void> {
  const db = await readDB();
  db.materialen = (db.materialen || []).filter(x => x.id !== id);
  await writeDB(db);
}

/* ===== Stats ===== */
export async function getCountsByGroup() {
  const db = await readDB();
  // Dummy implementation or calculate from indications/mutations
  const counts: Record<string, { indications: number; mutations: number }> = {};
  for (const g of db.groepen.list) {
    counts[g.id] = {
      indications: db.indicaties.filter(i => i.groepId === g.id && i.status === 'open').length,
      mutations: db.mutaties.filter(m => m.groepId === g.id && m.status === 'open').length,
    };
  }
  return counts;
}
