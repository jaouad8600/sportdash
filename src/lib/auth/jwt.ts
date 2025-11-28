import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'super-secret-dev-key-change-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signSession(payload: any, rememberMe: boolean = false) {
    const duration = rememberMe ? '30d' : '24h';
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(duration)
        .sign(key);
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}
