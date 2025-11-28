import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

const DB_PATH = path.join(process.cwd(), "data", "app-data.json");
const headers = { "cache-control": "no-store" };

async function readDB(): Promise<any> {
  try { return JSON.parse(await fs.readFile(DB_PATH, "utf8")); } catch { return {}; }
}
async function writeDB(db: any) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}
function toISO(d?: string) {
  if (!d) return null;
  const t = new Date(d); if (Number.isNaN(+t)) return null;
  return t.toISOString();
}
function itemDateISO(i: any) {
  // bepaal een datum om op te filteren/tellen
  return (
    toISO(i?.updatedAt) ||
    toISO(i?.createdAt) ||
    (i?.date ? toISO(i.date + "T00:00:00") : null)
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const groepId = url.searchParams.get("groepId") || url.searchParams.get("groupId") || undefined;

  const db = await readDB();
  let items: any[] = Array.isArray(db?.sportmomenten?.items) ? db.sportmomenten.items : [];

  if (groepId) items = items.filter((x) => (x.groepId || x.groupId) === groepId);

  // Sorteer veilig (fallback naar datum of lege string)
  items.sort((a, b) => {
    const aa = itemDateISO(a) || "";
    const bb = itemDateISO(b) || "";
    return bb.localeCompare(aa);
  });

  return NextResponse.json({ items }, { headers });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // Nieuwe velden voor uitgebreid sportmoment
  const groupId = body.groupId || body.groepId;
  const date = body.date;
  const startTime = body.startTime;
  const endTime = body.endTime;
  const location = body.location;
  const title = body.title || body.description;
  const type = body.type || "SPORT"; // Default type

  // Validatie verplichte velden
  if (!groupId) {
    return NextResponse.json(
      { error: "Groep is verplicht" },
      { status: 400, headers }
    );
  }

  if (!date) {
    return NextResponse.json(
      { error: "Datum is verplicht" },
      { status: 400, headers }
    );
  }

  if (!startTime) {
    return NextResponse.json(
      { error: "Starttijd is verplicht" },
      { status: 400, headers }
    );
  }

  if (!endTime) {
    return NextResponse.json(
      { error: "Eindtijd is verplicht" },
      { status: 400, headers }
    );
  }

  // Valideer dat eindtijd na starttijd ligt
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return NextResponse.json(
      { error: "Eindtijd moet na starttijd liggen" },
      { status: 400, headers }
    );
  }

  const now = new Date().toISOString();
  const db = await readDB();
  db.sportmomenten = db.sportmomenten && Array.isArray(db.sportmomenten.items)
    ? db.sportmomenten
    : { items: [] };

  // Genereer uniek ID
  const id = `${groupId}#${date}#${startTime}`;

  // Maak nieuw sportmoment
  const newMoment = {
    id,
    groupId,
    date,
    startTime,
    endTime,
    location: location || null,
    title: title || null,
    type,
    status: "PENDING",
    createdAt: now,
    updatedAt: now,
  };

  db.sportmomenten.items.push(newMoment);

  await writeDB(db);

  return NextResponse.json(
    { ok: true, item: newMoment },
    { headers }
  );
}

// Helper functie om tijd te converteren naar minuten
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
