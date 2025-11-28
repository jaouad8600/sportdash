
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

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
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Vul alle velden in' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens zijn' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id as string },
        });

        if (!user) {
            return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
        }

        const isValid = await verifyPassword(currentPassword, user.password);

        if (!isValid) {
            return NextResponse.json({ error: 'Huidige wachtwoord is onjuist' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Update password error:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}
