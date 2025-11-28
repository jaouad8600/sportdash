
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('session')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
        }

        const session = await verifySession(token);
        if (!session) {
            return NextResponse.json({ error: 'Sessie verlopen' }, { status: 401 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: 'Naam is verplicht' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.id as string },
            data: { name: name.trim() },
            select: {
                id: true,
                username: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                permissions: true,
            }
        });

        return NextResponse.json({ user: updatedUser });

    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}
