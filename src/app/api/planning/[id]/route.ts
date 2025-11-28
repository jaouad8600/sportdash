import { NextResponse } from "next/server";
import { updatePlanning, removePlanning } from "@/server/store";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const it = await updatePlanning(id, body);
  return NextResponse.json(it, { headers: { "cache-control": "no-store" } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await removePlanning(id);
  return NextResponse.json(
    { ok: true },
    { headers: { "cache-control": "no-store" } },
  );
}
