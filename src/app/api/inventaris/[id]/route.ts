import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB = join(process.cwd(), 'data', 'app-data.json');
function readDB() { if (!existsSync(DB)) return { inventaris: { items: [] } }; try { return JSON.parse(readFileSync(DB, 'utf8')); } catch { return { inventaris: { items: [] } }; } }
function writeDB(db: any) { writeFileSync(DB, JSON.stringify(db, null, 2), 'utf8'); }

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDB();
  const before = Array.isArray(db?.inventaris?.items) ? db.inventaris.items.length : 0;
  db.inventaris.items = (db.inventaris.items || []).filter((x: any) => String(x.id) !== String(id));
  writeDB(db);
  const after = db.inventaris.items.length;
  return NextResponse.json({ removed: before - after }, { status: 200 });
}
