import { NextResponse } from "next/server";
// Legacy route - these functions don't exist in @/lib/db
// import { addItem, readDb, isSameDay } from "@/lib/db";
// import type { SportItem } from "@/types/planning";

export async function GET(req: Request) {
  // TODO: Implement using Prisma instead of legacy db functions
  return NextResponse.json({ error: "This endpoint is not implemented" }, { status: 501 });
}

export async function POST(req: Request) {
  // TODO: Implement using Prisma instead of legacy db functions
  return NextResponse.json({ error: "This endpoint is not implemented" }, { status: 501 });
}

