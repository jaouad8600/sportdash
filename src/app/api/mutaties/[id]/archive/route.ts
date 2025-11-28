import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const F_MUT = path.join(process.cwd(), "data", "sportmutaties.json");

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

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const prisma = await getPrisma();
  const now = new Date();
  let body: any = {};
  try { body = await _.json(); } catch { }
  const reason = body?.reason ?? body?.reden ?? "gearchiveerd";

  if (prisma?.sportMutatie) {
    try {
      const upd = await prisma.sportMutatie.update({
        where: { id },
        data: { archivedAt: now, archivedReason: reason },
      });
      return NextResponse.json(upd, { status: 200 });
    } catch (e: any) {
      console.error("[mutaties][archive][prisma]", e);
    }
  }

  // File fallback
  try {
    const raw = await fs.readFile(F_MUT, "utf8").catch(() => "[]");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return NextResponse.json({ error: "store damaged" }, { status: 500 });
    const i = arr.findIndex((x: any) => x?.id === id);
    if (i < 0) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });
    arr[i] = { ...(arr[i] || {}), archivedAt: now.toISOString(), archivedReason: reason };
    await fs.writeFile(F_MUT, JSON.stringify(arr, null, 2));
    return NextResponse.json(arr[i], { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "error" }, { status: 500 });
  }
}
