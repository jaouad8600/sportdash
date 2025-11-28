import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const groups = await prisma.group.findMany({
        orderBy: { name: 'asc' },
    });
    console.log('Groups in DB:', groups.map(g => g.name));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
