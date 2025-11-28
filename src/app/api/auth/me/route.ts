import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  const payload = await verifySession(token);

  if (!payload) {
    return NextResponse.json({ user: null });
  }

  // Fetch fresh user data
  const user = await prisma.user.findUnique({
    where: { id: payload.id as string },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      permissions: true,
    },
  });

  if (!user || !user.isActive) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user });
}
