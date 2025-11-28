
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch all active groups
        const groups = await prisma.group.findMany({
            where: { isActive: true },
            include: {
                extraSportMoments: {
                    where: {
                        date: {
                            gte: new Date(new Date().setDate(new Date().getDate() - 30)), // Last 30 days
                        },
                        status: 'COMPLETED',
                    },
                },
            },
        });

        // Calculate priority
        // Logic: Fewer moments = Higher priority
        // We can also add logic for "refused" moments if needed, but keeping it simple for now.
        const priorityList = groups.map((group) => {
            const momentCount = group.extraSportMoments.length;
            // Simple score: 100 - count (so 0 moments = 100 priority)
            // In a real app, this might be more complex (weighted by days since last moment, etc.)
            const score = Math.max(0, 100 - (momentCount * 10));

            return {
                id: group.id,
                name: group.name,
                score,
                momentCount,
            };
        });

        // Sort by score descending (highest priority first)
        priorityList.sort((a, b) => b.score - a.score);

        return NextResponse.json(priorityList);
    } catch (error) {
        console.error('Error calculating extra sport priority:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}
