import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KORTVERBLIJF_ITEMS = [
    { name: 'Banken', quantity: 4, category: 'OVERIG' },
    { name: 'Doelen', quantity: 2, category: 'OVERIG' },
    { name: 'Basket', quantity: 4, category: 'OVERIG' },
    { name: 'Tafeltennis tafel', quantity: 1, category: 'OVERIG' },
    { name: 'Tafeltennis rackets', quantity: 4, category: 'OVERIG' },
    { name: 'Net houders', quantity: 4, category: 'OVERIG' },
    { name: 'Volleybalnet', quantity: 1, category: 'OVERIG' },
    { name: 'Badmintonnet', quantity: 1, category: 'OVERIG' },
    { name: 'Trampoline', quantity: 2, category: 'OVERIG' },
    { name: 'Bok', quantity: 1, category: 'OVERIG' },
    { name: 'Springplank', quantity: 1, category: 'OVERIG' },
    { name: 'Kasten', quantity: 2, category: 'OVERIG' },
    { name: 'Dikke mat', quantity: 2, category: 'MATTEN' },
    { name: 'Touw', quantity: 3, category: 'OVERIG' },
    { name: 'Blauwe matten', quantity: 6, category: 'MATTEN' },
    { name: 'Grijze matten', quantity: 7, category: 'MATTEN' },
    { name: 'Slip matten', quantity: 0, category: 'MATTEN' },
    { name: 'Extra trampoline cover', quantity: 1, category: 'OVERIG' },
    { name: 'Zwaaistok', quantity: 1, category: 'OVERIG' },
    { name: 'Ringstok', quantity: 1, category: 'OVERIG' },
];

const LANGVERBLIJF_ITEMS = [
    { name: 'dumbbels (2 tm 40 kg)', quantity: 1, category: 'FITNESS' },
    { name: 'dumbbel rack', quantity: 2, category: 'FITNESS' },
    { name: 'Bicep curl bankje', quantity: 1, category: 'FITNESS' },
    { name: 'bicep curl stang', quantity: 1, category: 'FITNESS' },
    { name: 'Airbike', quantity: 1, category: 'FITNESS' },
    { name: 'Cable station', quantity: 1, category: 'FITNESS' },
    { name: 'Seated leg press', quantity: 1, category: 'FITNESS' },
    { name: 'Leg extension', quantity: 1, category: 'FITNESS' },
    { name: 'Pectoral fly', quantity: 1, category: 'FITNESS' },
    { name: 'Bench press', quantity: 1, category: 'FITNESS' },
    { name: 'Fitness Bankje', quantity: 2, category: 'FITNESS' },
    { name: 'Cross box', quantity: 1, category: 'FITNESS' },
    { name: 'schijven 1,25', quantity: 2, category: 'FITNESS' },
    { name: 'schijven 2,5 kg', quantity: 4, category: 'FITNESS' },
    { name: 'schijven 5 kg', quantity: 4, category: 'FITNESS' },
    { name: 'schijven 10 kg', quantity: 4, category: 'FITNESS' },
    { name: 'schijven 15 kg', quantity: 2, category: 'FITNESS' },
    { name: 'schijven 20 kg', quantity: 2, category: 'FITNESS' },
    { name: 'schijven 25 kg', quantity: 2, category: 'FITNESS' },
    { name: 'Stang 20 kg', quantity: 1, category: 'FITNESS' },
    { name: 'stang 15 kg', quantity: 1, category: 'FITNESS' },
    { name: 'Lunch rek', quantity: 1, category: 'FITNESS' },
    { name: 'fitness matten', quantity: 3, category: 'MATTEN' },
    { name: 'Cable station atributen rug', quantity: 4, category: 'FITNESS' },
    { name: 'cable station atributen tricep', quantity: 2, category: 'FITNESS', description: '2 stangen 2 touwen' },
    { name: 'cable station atributen bicep', quantity: 4, category: 'FITNESS', description: '4 handvatten' },
    { name: 'Deadlift gordel', quantity: 2, category: 'FITNESS' },
    { name: 'Pullup gordel', quantity: 1, category: 'FITNESS' },
    { name: 'Stanghouder', quantity: 1, category: 'FITNESS' },
    { name: 'Lower back bench', quantity: 1, category: 'FITNESS' },
    { name: 'Arm blaster', quantity: 1, category: 'FITNESS' },
    { name: 'Elastieken', quantity: 2, category: 'ELASTIEKEN' },
];

async function seedMaterials() {
    console.log('Seeding materials...');

    // Clear existing materials? Maybe safer to just add if not exists, but for clean slate:
    // await prisma.material.deleteMany({}); 

    // Seed Kortverblijf
    for (const item of KORTVERBLIJF_ITEMS) {
        await prisma.material.create({
            data: {
                name: item.name,
                quantityTotal: item.quantity,
                quantityUsable: item.quantity,
                category: item.category as any,
                location: 'KORTVERBLIJF', // Using location to distinguish
                conditionStatus: 'GOED',
            },
        });
    }

    // Seed Langverblijf
    for (const item of LANGVERBLIJF_ITEMS) {
        await prisma.material.create({
            data: {
                name: item.name,
                quantityTotal: item.quantity,
                quantityUsable: item.quantity,
                category: item.category as any,
                location: 'LANGVERBLIJF', // Using location to distinguish
                conditionStatus: 'GOED',
                description: item.description,
            },
        });
    }

    console.log('Materials seeded successfully.');
}

seedMaterials()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
