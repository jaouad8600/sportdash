import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const date = dateParam ? new Date(dateParam) : new Date();

    const start = startOfDay(date);
    const end = endOfDay(date);

    try {
        // 1. Extra Sport Moments
        const extraMoments = await prisma.extraSportMoment.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                group: true,
            },
            orderBy: {
                date: 'asc',
            }
        });

        // 2. Restrictions
        const restrictions = await prisma.restriction.findMany({
            where: {
                isActive: true,
                startDate: { lte: end },
                OR: [
                    { endDate: null },
                    { endDate: { gte: start } }
                ]
            },
            include: {
                group: true,
                youth: true,
            },
        });

        // Format for frontend
        const items = [
            ...extraMoments.map(m => ({
                id: m.id,
                type: 'Extra Sport',
                title: `Extra Sport - ${m.group.name}`,
                time: m.date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
                link: `/schedule?date=${date.toISOString().split('T')[0]}` // Deep link if needed
            })),
            ...restrictions.map(r => ({
                id: r.id,
                type: 'Beperking',
                title: `Beperking - ${r.youth.firstName} ${r.youth.lastName.charAt(0)}.`,
                time: 'Hele dag',
                link: `/groups/${r.groupId}`
            }))
        ];

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error fetching schedule:', error);
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 });
    }
}
