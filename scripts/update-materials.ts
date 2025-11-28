/**
 * Script to update material location names in the database
 * Run with: npx tsx scripts/update-materials.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating material locations...\n');

    try {
        // Get all materials first
        const allMaterials = await prisma.material.findMany();

        let updatedCount = 0;

        // Update each material that matches old location names
        for (const material of allMaterials) {
            const oldLocation = material.location;
            let newLocation = oldLocation;

            // Check for sporthal variations
            if (oldLocation.toLowerCase().includes('sporthal')) {
                newLocation = 'Sportzaal EB';
            }
            // Check for fitness langverblijf variations
            else if (oldLocation.toLowerCase().includes('langverblijf') && oldLocation.toLowerCase().includes('fitness')) {
                newLocation = 'Fitness Vloed';
            }

            // Update if location changed
            if (newLocation !== oldLocation) {
                await prisma.material.update({
                    where: { id: material.id },
                    data: { location: newLocation }
                });
                console.log(`  ✅ Updated: "${oldLocation}" → "${newLocation}" (${material.name})`);
                updatedCount++;
            }
        }

        console.log(`\n✨ Updated ${updatedCount} material location(s) successfully!`);

        // Show current materials grouped by location
        const updatedMaterials = await prisma.material.findMany({
            select: {
                id: true,
                name: true,
                location: true
            },
            orderBy: {
                location: 'asc'
            }
        });

        console.log('\n📦 Current materials in database:');

        // Group by location
        const byLocation: Record<string, string[]> = {};
        updatedMaterials.forEach(m => {
            if (!byLocation[m.location]) {
                byLocation[m.location] = [];
            }
            byLocation[m.location].push(m.name);
        });

        Object.entries(byLocation).forEach(([location, items]) => {
            console.log(`\n  📍 ${location}:`);
            items.forEach(item => console.log(`     - ${item}`));
        });

    } catch (error) {
        console.error('❌ Error updating materials:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
