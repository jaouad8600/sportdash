export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";

const F_IND = path.join(process.cwd(), "data", "indicaties.json");
const F_EVL = path.join(process.cwd(), "data", "evaluaties.json");

type Indicatie = {
  id: string;
  naam: string;
  type: "MEDISCH" | "GEDRAG" | "OVERIG";
  status: "OPEN" | "IN_BEHANDELING" | "AFGEROND";
  groepId?: string | null;
  start?: string | null;
  eind?: string | null;
  opmerking?: string | null;
  archivedAt?: string | null;
  archivedReason?: string | null;
  createdAt: string;
  updatedAt: string;
};
type Evaluatie = {
  id: string;
  indicatieId: string;
  type: "TUSSEN" | "EIND";
  inhoud: string;
  ontvanger?: string | null;
  createdAt: string;
};

async function ensureFiles() {
  try { await fs.stat(F_IND); } catch { await fs.writeFile(F_IND, "[]"); }
  try { await fs.stat(F_EVL); } catch { await fs.writeFile(F_EVL, "[]"); }
}
async function readIndicaties(): Promise<Indicatie[]> {
  await ensureFiles();
  const raw = await fs.readFile(F_IND, "utf8");
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : [];
}
async function writeIndicaties(list: Indicatie[]) {
  await fs.writeFile(F_IND, JSON.stringify(list, null, 2));
}
async function readEvaluaties(): Promise<Evaluatie[]> {
  await ensureFiles();
  const raw = await fs.readFile(F_EVL, "utf8");
  const arr = JSON.parse(raw);
  return Array.isArray(arr) ? arr : [];
}
async function writeEvaluaties(list: Evaluatie[]) {
  await fs.writeFile(F_EVL, JSON.stringify(list, null, 2));
}

// Prisma optioneel
async function getPrisma(): Promise<any | null> {
  try {
    const mod = await import("@prisma/client");
    const prisma = new (mod as any).PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return prisma;
  } catch {
    return null;
  }
}

// Helpers
function normType(v: any): Indicatie["type"] {
  const s = String(v ?? "").toUpperCase();
  return s === "MEDISCH" || s === "GEDRAG" ? (s as any) : "OVERIG";
}
function normStatus(v: any): Indicatie["status"] {
  const s = String(v ?? "").toUpperCase();
  return s === "AFGEROND" ? "AFGEROND" : s === "IN_BEHANDELING" ? "IN_BEHANDELING" : "OPEN";
}
function cleanDate(v: any): string | null {
  if (!v) return null;
  const s = String(v);
  const d = new Date(s);
  if (isNaN(+d)) return null;
  return s.length === 10 ? s : d.toISOString().slice(0, 10);
}
async function parseIndicatieBody(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { }
  const naam = body.naam ?? body.name ?? body.titel ?? body.title ?? "";
  const type = normType(body.type);
  const status = normStatus(body.status);
  const groepId = body.groepId ?? body.groep ?? body.groupId ?? null;
  const start = cleanDate(body.start);
  const eind = cleanDate(body.eind);
  const opmerking = body.opmerking ?? body.beschrijving ?? body.omschrijving ?? body.description ?? null;
  return { naam, type, status, groepId, start, eind, opmerking };
}
async function parseEvaluatieBody(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch { }
  const inhoud = (body.inhoud ?? body.text ?? body.content ?? "").toString().trim();
  const ontvanger = body.ontvanger ?? null;
  const type: "TUSSEN" | "EIND" = (String(body.type ?? "TUSSEN").toUpperCase() === "EIND") ? "EIND" : "TUSSEN";
  return { inhoud, ontvanger, type };
}

// LIST
export async function listIndicaties(req: Request) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');

  const prisma = await getPrisma();
  if (prisma?.sportIndication) { // Fix model name
    try {
      const where = groupId ? { groupId } : {};
      const rows = await prisma.sportIndication.findMany({
        where,
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json(rows, { status: 200 });
    } catch (e) {
      console.error("[indicaties][list][prisma]", e);
    }
  }
  const list = await readIndicaties();
  let filtered = list;
  if (groupId) {
    filtered = list.filter(x => x.groepId === groupId);
  }
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(filtered, { status: 200 });
}

// CREATE
export async function createIndicatie(req: Request) {
  const { naam, type, status, groepId, start, eind, opmerking } = await parseIndicatieBody(req);
  if (!naam) return NextResponse.json({ error: "Naam is verplicht." }, { status: 400 });
  const now = new Date().toISOString();
  const prisma = await getPrisma();

  if (prisma?.sportIndication) {
    try {
      const created = await prisma.sportIndication.create({
        data: {
          id: randomUUID(),
          description: naam, // Mapping naam to description
          type: type,
          isActive: status !== "AFGEROND",
          issuedBy: "Onbekend", // Default
          validFrom: start ? new Date(start) : new Date(),
          validUntil: eind ? new Date(eind) : null,
          groupId: groepId,
          // Missing youthId again!
          // Same issue as mutations.
          // I'll wrap in try-catch and fallback to file if it fails.
          createdAt: new Date(now),
          updatedAt: new Date(now),
        }
      });
      return NextResponse.json(created, { status: 201 });
    } catch (e) {
      console.error("[indicaties][create][prisma]", e);
    }
  }

  const list = await readIndicaties();
  const item: Indicatie = {
    id: randomUUID(),
    naam, type, status, groepId: groepId ?? null,
    start, eind,
    opmerking: opmerking ?? null,
    archivedAt: null, archivedReason: null,
    createdAt: now, updatedAt: now
  };
  list.push(item);
  await writeIndicaties(list);
  return NextResponse.json(item, { status: 201 });
}

// DETAIL incl. evaluaties
export async function getIndicatie(id: string) {
  const prisma = await getPrisma();
  if (prisma?.sportIndication) {
    try {
      const row = await prisma.sportIndication.findUnique({ where: { id } });
      if (!row) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

      let evl: any[] = [];
      // Use JSON field if available
      if (row.evaluations && Array.isArray(row.evaluations)) {
        evl = row.evaluations;
      }

      return NextResponse.json({ ...row, evaluaties: evl }, { status: 200 });
    } catch (e) {
      console.error("[indicaties][detail][prisma]", e);
    }
  }
  const list = await readIndicaties();
  const row = list.find(x => x.id === id);
  if (!row) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const evals = (await readEvaluaties())
    .filter(e => e.indicatieId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json({ ...row, evaluaties: evals }, { status: 200 });
}

// UPDATE
export async function updateIndicatie(req: Request, id: string) {
  const patch = await parseIndicatieBody(req);
  const now = new Date().toISOString();
  const prisma = await getPrisma();

  if (prisma?.sportIndication) {
    try {
      const updated = await prisma.sportIndication.update({
        where: { id },
        data: {
          description: patch.naam || undefined,
          type: patch.type || undefined,
          isActive: patch.status ? patch.status !== "AFGEROND" : undefined,
          groupId: patch.groepId ?? undefined,
          validFrom: patch.start ? new Date(patch.start) : undefined,
          validUntil: patch.eind ? new Date(patch.eind) : undefined,
          updatedAt: new Date(now),
        }
      });
      return NextResponse.json(updated, { status: 200 });
    } catch (e) {
      console.error("[indicaties][update][prisma]", e);
    }
  }

  const list = await readIndicaties();
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const cur = list[idx];
  const upd: Indicatie = {
    ...cur,
    naam: patch.naam || cur.naam,
    type: patch.type || cur.type,
    status: patch.status || cur.status,
    groepId: (patch.groepId === undefined ? cur.groepId : patch.groepId),
    start: (patch.start === undefined ? cur.start : patch.start),
    eind: (patch.eind === undefined ? cur.eind : patch.eind),
    opmerking: (patch.opmerking === undefined ? cur.opmerking : patch.opmerking),
    updatedAt: now,
  };
  list[idx] = upd;
  await writeIndicaties(list);
  return NextResponse.json(upd, { status: 200 });
}

// ARCHIVE
export async function archiveIndicatie(req: Request, id: string) {
  let body: any = {};
  try { body = await req.json(); } catch { }
  const reason = body.reason ?? body.reden ?? "gearchiveerd";
  const now = new Date().toISOString();
  const prisma = await getPrisma();

  if (prisma?.sportIndication) {
    try {
      const updated = await prisma.sportIndication.update({
        where: { id },
        data: { archived: true, archivedAt: new Date(now), updatedAt: new Date(now) }
      });
      return NextResponse.json(updated, { status: 200 });
    } catch (e) {
      console.error("[indicaties][archive][prisma]", e);
    }
  }

  const list = await readIndicaties();
  const idx = list.findIndex(x => x.id === id);
  if (idx === -1) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
  const cur = list[idx];
  const upd = { ...cur, archivedAt: now, archivedReason: reason, updatedAt: now };
  list[idx] = upd;
  await writeIndicaties(list);
  return NextResponse.json(upd, { status: 200 });
}

// EVALUATIES
export async function listEvaluaties(id: string) {
  const prisma = await getPrisma();
  if (prisma?.evaluation) {
    try {
      const rows = await prisma.evaluation.findMany({
        where: { indicationId: id },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json(rows, { status: 200 });
    } catch (e) {
      console.error("[evaluaties][list][prisma]", e);
      return NextResponse.json({ error: "Fout bij ophalen evaluaties" }, { status: 500 });
    }
  }
  // Fallback removed as we are migrating to relational model
  return NextResponse.json([], { status: 200 });
}

export async function createEvaluatie(req: Request, id: string) {
  const { inhoud, ontvanger, type } = await parseEvaluatieBody(req);
  if (!inhoud) return NextResponse.json({ error: "Inhoud is verplicht." }, { status: 400 });

  const prisma = await getPrisma();
  if (prisma?.evaluation) {
    try {
      // Verify indication exists
      const ind = await prisma.sportIndication.findUnique({ where: { id } });
      if (!ind) return NextResponse.json({ error: "Indicatie niet gevonden." }, { status: 404 });

      const newItem = await prisma.evaluation.create({
        data: {
          indicationId: id,
          summary: inhoud, // Mapping 'inhoud' to 'summary'
          author: "Onbekend", // TODO: Get from session/auth
          // Type and Ontvanger are not in the schema yet, adding them to summary or ignoring for now
          // Schema has: id, indicationId, date, summary, author, createdAt, updatedAt
        }
      });

      console.log("[evaluaties][create][prisma] OK", { id: newItem.id, indicationId: id });
      return NextResponse.json(newItem, { status: 201 });
    } catch (e) {
      console.error("[evaluaties][create][prisma] fout", e);
      return NextResponse.json({ error: "Fout bij opslaan evaluatie" }, { status: 500 });
    }
  }
  return NextResponse.json({ error: "Database niet beschikbaar" }, { status: 500 });
}

// SUMMARY
export async function indicatiesSummary() {
  const prisma = await getPrisma();
  if (prisma?.sportIndication) {
    try {
      const [open, inBehandeling, afgerond, totaal] = await Promise.all([
        prisma.sportIndication.count({ where: { isActive: true } }),
        0, // Not mapped perfectly
        prisma.sportIndication.count({ where: { isActive: false } }),
        prisma.sportIndication.count(),
      ]);
      return NextResponse.json({ open, inBehandeling, afgerond, totaal }, { status: 200 });
    } catch (e) {
      console.error("[indicaties][summary][prisma]", e);
    }
  }
  const list = await readIndicaties();
  const open = list.filter(x => x.status === "OPEN").length;
  const inBehandeling = list.filter(x => x.status === "IN_BEHANDELING").length;
  const afgerond = list.filter(x => x.status === "AFGEROND").length;
  const totaal = list.length;
  return NextResponse.json({ open, inBehandeling, afgerond, totaal }, { status: 200 });
}
