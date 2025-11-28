export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { deleteNote } from "@/server/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const { id, noteId } = await params;
    await deleteNote(id, noteId);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Onbekende fout" },
      { status: 400 },
    );
  }
}
