import { NextResponse } from 'next/server';
import fs from 'fs'; import path from 'path';
const DATA = path.join(process.cwd(), 'data', 'app-data.json');
const read = () => JSON.parse(fs.readFileSync(DATA, 'utf8') || '{}');
const write = (db: any) => fs.writeFileSync(DATA, JSON.stringify(db, null, 2));

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json().catch(() => ({} as any));
  const db = read(); const arr = db.mutaties?.items || []; const i = arr.findIndex((x: any) => x.id === id);
  if (i < 0) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  arr[i] = { ...arr[i], ...patch }; write(db);
  return NextResponse.json({ item: arr[i] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = read(); const arr = db.mutaties?.items || []; const i = arr.findIndex((x: any) => x.id === id);
  if (i < 0) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
  arr.splice(i, 1); write(db);
  return NextResponse.json({ ok: true });
}
