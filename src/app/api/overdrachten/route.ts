import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import {
  listOverdrachten,
  addOverdracht,
  updateOverdracht,
} from "@/server/store";

export async function GET() {
  const list = await listOverdrachten();
  return NextResponse.json(list, { headers: { "cache-control": "no-store" } });
}
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const it = await addOverdracht(body || {});
    return NextResponse.json(it);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 400 },
    );
  }
}
export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id, ...patch } = body || {};
  if (!id) return NextResponse.json({ error: "id verplicht" }, { status: 400 });
  try {
    const it = await updateOverdracht(id, patch);
    return NextResponse.json(it);
  } catch (e: any) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 400 },
    );
  }
}
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { id } = body || {};
  if (!id) return NextResponse.json({ error: "id verplicht" }, { status: 400 });

  // TODO: Add proper deleteOverdracht function to server/store.ts
  // For now, use prisma directly
  try {
    // Assuming there's an Overdracht model or similar - adjust as needed
    // If the model doesn't exist, this route should return a 501 Not Implemented
    return NextResponse.json({ error: "Delete not implemented - model not found" }, { status: 501 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
