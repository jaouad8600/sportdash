export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { addGroepNotitie } from "@/server/store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const note = await addGroepNotitie(id, b.tekst || "", b.auteur);
    return NextResponse.json(note, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Onbekende fout" },
      { status: 400 },
    );
  }
}
