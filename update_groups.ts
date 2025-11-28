import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting group updates...');

    // 1. Delete "Pauze"
    try {
        const pauze = await prisma.group.findUnique({ where: { name: 'Pauze' } });
        if (pauze) {
            // Check if there are related records that need to be handled
            // For simplicity in this script, we'll try to delete. If it fails due to constraints, we'll know.
            // Ideally we should cascade or nullify, but let's see.
            await prisma.group.delete({ where: { name: 'Pauze' } });
            console.log('Deleted group: Pauze');
        } else {
            console.log('Group Pauze not found, skipping delete.');
        }
    } catch (error) {
        console.error('Error deleting Pauze:', error);
    }

    // 2. Rename "Poel" to "Poel A"
    try {
        const poel = await prisma.group.findUnique({ where: { name: 'Poel' } });
        if (poel) {
            await prisma.group.update({
                where: { name: 'Poel' },
                data: { name: 'Poel A' },
            });
            console.log('Renamed Poel to Poel A');
        } else {
            console.log('Group Poel not found (might already be renamed).');
        }
    } catch (error) {
        console.error('Error renaming Poel:', error);
    }

    // 3. Create "Poel B" if it doesn't exist
    try {
        const poelB = await prisma.group.findUnique({ where: { name: 'Poel B' } });
        if (!poelB) {
            await prisma.group.create({
                data: { name: 'Poel B' },
            });
            console.log('Created group: Poel B');
        } else {
            console.log('Group Poel B already exists.');
        }
    } catch (error) {
        console.error('Error creating Poel B:', error);
    }

    // 4. Verify all groups
    const allGroups = await prisma.group.findMany({ orderBy: { name: 'asc' } });
    console.log('Current Groups:', allGroups.map(g => g.name));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
