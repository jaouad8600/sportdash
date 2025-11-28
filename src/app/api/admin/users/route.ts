import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth/jwt';

// Helper to check admin
async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return false;
    const payload = await verifySession(token);
    return payload?.role === 'BEHEERDER';
}

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            name: true,
            role: true,
            isActive: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
}

export async function POST(request: Request) {
    if (!(await isAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { username, name, password, role } = body;

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                username,
                name,
                password: hashedPassword,
                role,
            },
        });

        const { password: _, ...userWithoutPassword } = newUser;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error('Create user error', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
