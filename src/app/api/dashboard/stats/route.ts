import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const groups = await prisma.group.findMany({
            where: {
                status: 'ACTIVE',
            },
            select: {
                color: true,
            },
        });

        const stats = {
            GROEN: 0,
            GEEL: 0,
            ORANJE: 0,
            ROOD: 0,
        };

        groups.forEach((group) => {
            // Ensure color is one of the keys, handle nulls if any
            if (group.color && Object.prototype.hasOwnProperty.call(stats, group.color)) {
                stats[group.color as keyof typeof stats]++;
            }
        });

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching group stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
