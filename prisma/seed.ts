import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

const prisma = new PrismaClient();

async function main() {
    const password = await hashPassword('admin');

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            name: 'Systeem Beheerder',
            password,
            role: Role.BEHEERDER,
            isActive: true,
        },
    });

    console.log({ admin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
