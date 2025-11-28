import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

export async function GET() {
  // TODO: Event model doesn't exist in schema - this route needs to be updated or removed
  // const items = await prisma.event.findMany({
  //   orderBy: { ts: "desc" },
  //   take: 200,
  // });
  return NextResponse.json([]);
}
