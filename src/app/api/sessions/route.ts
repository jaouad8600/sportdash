import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const groupId = searchParams.get('groupId');
  const where: any = {};
  if (date) {
    const dayStart = new Date(date);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    where.date = { gte: dayStart, lt: dayEnd };
  }
  if (groupId) where.groupId = groupId;
  const sessions = await prisma.session.findMany({ where, include: { incidents: true } });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  try {
    const newSession = await prisma.session.create({
      data: {
        groupId: data.groupId,
        date: new Date(data.date),
        docentId: (session.user as any).id,
        headcount: data.headcount,
        warmup: data.warmup,
        activity: data.activity,
        cooldown: data.cooldown,
        atmosphere: data.atmosphere,
        interventions: data.interventions,
        notes: data.notes,
        planTomorrow: data.planTomorrow,
      },
    });
    return NextResponse.json(newSession);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
