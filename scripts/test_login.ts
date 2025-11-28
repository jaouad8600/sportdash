
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-dev-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

async function signSession(payload: any, rememberMe: boolean = false) {
    const duration = rememberMe ? '30d' : '24h';
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(duration)
        .sign(key);
}

async function main() {
    console.log('Testing login flow...');
    try {
        const username = 'admin';
        const password = 'admin';
        const rememberMe = false;

        console.log('1. Finding user...');
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            console.error('User not found');
            return;
        }
        console.log('User found:', user.username);

        console.log('2. Verifying password...');
        const isValid = await verifyPassword(password, user.password);
        console.log('Password valid:', isValid);

        if (!isValid) {
            console.error('Invalid password');
            return;
        }

        console.log('3. Signing session...');
        const sessionPayload = {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
        };

        const token = await signSession(sessionPayload, rememberMe);
        console.log('Token generated:', token.substring(0, 20) + '...');

        console.log('Login flow successful');

    } catch (error) {
        console.error('Error in login flow:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
