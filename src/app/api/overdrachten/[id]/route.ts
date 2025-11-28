import { NextResponse } from "next/server";
import { updateOverdracht, removeOverdracht } from "@/server/store";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateOverdracht(id, body);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await removeOverdracht(id);
  return NextResponse.json({ ok: true });
}
