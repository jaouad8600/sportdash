import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const data = await req.json();
  const report = await prisma.sessionReport.create({
    data: {
      groupId: data.groupId,
      createdById: data.createdById,
      date: new Date(data.date),
      warmingUp: data.warmingUp,
      sportActivity: data.sportActivity,
      bijzonderheden: data.bijzonderheden,
      groepssfeer: data.groepssfeer,
      interventies: data.interventies,
      incidenten: data.incidenten,
      afsprakenVoorMorgen: data.afsprakenVoorMorgen,
    },
  });
  return NextResponse.json(report);
}
