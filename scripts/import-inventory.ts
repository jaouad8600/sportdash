/**
 * Script to import inventory items from spreadsheets into materials database
 * Run with: npx tsx scripts/import-inventory.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sporthal Kortverblijf items
const sporthalItems = [
    { name: 'Banken', quantity: 4, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Doelen', quantity: 2, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Basket', quantity: 4, location: 'Sportzaal EB', category: 'BALLEN', condition: 'GOED' },
    { name: 'Tafeltennis tafel', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'KAPOT', broken: 1 },
    { name: 'Tafeltennis rackets', quantity: 4, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Net houders', quantity: 4, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Volleybalnet', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Badmintonnet', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Trampoline', quantity: 2, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Bok', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Springplank', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Kasten', quantity: 2, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Dikke mat', quantity: 2, location: 'Sportzaal EB', category: 'MATTEN', condition: 'GOED' },
    { name: 'Touw', quantity: 3, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Blauwe matten', quantity: 6, location: 'Sportzaal EB', category: 'MATTEN', condition: 'GOED' },
    { name: 'Grijze matten', quantity: 7, location: 'Sportzaal EB', category: 'MATTEN', condition: 'GOED' },
    { name: 'Slip matten', quantity: 1, location: 'Sportzaal EB', category: 'MATTEN', condition: 'GOED' },
    { name: 'Extra trampoline cover', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Zwaaistok', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
    { name: 'Ringstok', quantity: 1, location: 'Sportzaal EB', category: 'OVERIG', condition: 'GOED' },
];

// Fitness Langverblijf items
const fitnessItems = [
    { name: 'Dumbbels 2-40 kg', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED', description: '2 tm 40 kg set' },
    { name: 'Dumbbell rack', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Bicep curl bankje', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Bicep curl stang', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Airbike', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Cable station', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Seated leg press', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Leg extension', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Pectoral fly', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Bench press', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Fitness Bankje', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Cross box', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 1,25 kg', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 2,5 kg', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 5 kg', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 10 kg', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 15 kg', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 20 kg', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Schijven 25 kg', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Stang 20 kg', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Stang 15 kg', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Lunch rek', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Fitness matten', quantity: 3, location: 'Fitness Vloed', category: 'MATTEN', condition: 'GOED' },
    { name: 'Cable station attributen rug', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Cable station attributen tricep', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED', description: '2 stangen 2 touwen' },
    { name: 'Cable station attributen bicep', quantity: 4, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED', description: '4 handvatten' },
    { name: 'Deadlift gordel', quantity: 2, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Pullup gordel', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Stanghouder', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Lower back bench', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Arm blaster', quantity: 1, location: 'Fitness Vloed', category: 'FITNESS', condition: 'GOED' },
    { name: 'Elastieken', quantity: 2, location: 'Fitness Vloed', category: 'ELASTIEKEN', condition: 'LICHT_BESCHADIGD', broken: 1 },
];

async function main() {
    console.log('🔄 Importing inventory items...\n');

    try {
        let importedCount = 0;

        // Import Sporthal items
        console.log('📦 Importing Sporthal Kortverblijf items...');
        for (const item of sporthalItems) {
            await prisma.material.create({
                data: {
                    name: item.name,
                    category: item.category as any,
                    quantityTotal: item.quantity,
                    quantityUsable: item.quantity - (item.broken || 0),
                    quantityBroken: item.broken || 0,
                    quantityToOrder: 0,
                    location: item.location,
                    conditionStatus: item.condition as any,
                    description: item.description || null,
                },
            });
            console.log(`  ✅ ${item.name} (${item.quantity}x)`);
            importedCount++;
        }

        // Import Fitness items
        console.log('\n💪 Importing Fitness Langverblijf items...');
        for (const item of fitnessItems) {
            await prisma.material.create({
                data: {
                    name: item.name,
                    category: item.category as any,
                    quantityTotal: item.quantity,
                    quantityUsable: item.quantity - (item.broken || 0),
                    quantityBroken: item.broken || 0,
                    quantityToOrder: 0,
                    location: item.location,
                    conditionStatus: item.condition as any,
                    description: item.description || null,
                },
            });
            console.log(`  ✅ ${item.name} (${item.quantity}x)`);
            importedCount++;
        }

        console.log(`\n✨ Successfully imported ${importedCount} inventory items!`);

        // Show summary by location
        const materials = await prisma.material.findMany({
            select: {
                location: true,
                name: true,
                quantityTotal: true,
            },
            orderBy: {
                location: 'asc',
            },
        });

        const byLocation: Record<string, number> = {};
        materials.forEach(m => {
            byLocation[m.location] = (byLocation[m.location] || 0) + 1;
        });

        console.log('\n📊 Summary by location:');
        Object.entries(byLocation).forEach(([location, count]) => {
            console.log(`  📍 ${location}: ${count} items`);
        });

    } catch (error) {
        console.error('❌ Error importing inventory:', error);
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
