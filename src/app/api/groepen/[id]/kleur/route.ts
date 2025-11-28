import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'app-data.json');

const KLEUR_HEX: Record<string, string> = {
  rood: '#ef4444', oranje: '#f97316', geel: '#f59e0b', groen: '#22c55e',
  blauw: '#3b82f6', paars: '#a855f7', turkoois: '#14b8a6', grijs: '#6b7280',
  zwart: '#111827', wit: '#ffffff'
};
const ALIAS: Record<string, string> = {
  red: 'rood', yellow: 'geel', green: 'groen', blue: 'blauw', purple: 'paars',
  orange: 'oranje', pink: 'roze', gray: 'grijs', grey: 'grijs', black: 'zwart',
  white: 'wit', turquoise: 'turkoois'
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const raw = String(body?.kleur ?? body?.colorName ?? '').trim().toLowerCase();
  const kleur = ALIAS[raw] || raw;
  const hex = KLEUR_HEX[kleur];
  if (!kleur || !hex) return NextResponse.json({ error: 'Onbekende kleur' }, { status: 400 });
  if (!fs.existsSync(DATA_PATH)) return NextResponse.json({ error: 'DB ontbreekt' }, { status: 404 });

  const db = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8') || '{}');
  let touched = false;
  for (const key of ['groepen', 'groups']) {
    const arr = Array.isArray(db[key]) ? db[key] : null;
    if (!arr) continue;
    const i = arr.findIndex((g: any) => g?.id === id);
    if (i >= 0) { arr[i] = { ...arr[i], kleur, colorName: kleur, color: hex, hex }; touched = true; }
  }
  if (!touched) return NextResponse.json({ error: 'Groep niet gevonden' }, { status: 404 });

  fs.writeFileSync(DATA_PATH, JSON.stringify(db, null, 2));
  return NextResponse.json({ ok: true });
}
