import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  try {
    const incident = await prisma.incident.create({
      data: {
        sessionId: data.sessionId,
        youthFullName: data.youthFullName,
        time: new Date(data.time),
        description: data.description,
        heard: data.heard,
        measure: data.measure,
        location: data.location,
        followUp: data.followUp,
        createdById: (session.user as any).id,
      },
    });
    return NextResponse.json(incident);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
