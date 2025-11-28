import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    try {
        const where: any = {};
        if (groupId) where.groupId = groupId;
        if (activeOnly) where.isActive = true;

        const mutations = await prisma.sportMutation.findMany({
            where,
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                youth: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(mutations);
    } catch (error) {
        console.error('Error fetching mutations:', error);
        return NextResponse.json({ error: 'Failed to fetch mutations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupId, reason, reasonType, restriction, injuryDetails, startDate, endDate } = body;

        if (!groupId || !reason || !reasonType || !startDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const mutation = await prisma.sportMutation.create({
            data: {
                groupId,
                reason,
                reasonType,
                restriction,
                injuryDetails,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                createdBy: 'SYSTEM', // TODO: Get from session
            },
        });

        return NextResponse.json(mutation);
    } catch (error) {
        console.error('Error creating mutation:', error);
        return NextResponse.json({ error: 'Failed to create mutation' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, reason, reasonType, startDate, endDate, isActive, restriction } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID required' }, { status: 400 });
        }

        const data: any = {};
        if (reason) data.reason = reason;
        if (reasonType) data.reasonType = reasonType;
        if (restriction !== undefined) data.restriction = restriction;
        if (startDate) data.startDate = new Date(startDate);
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
        if (isActive !== undefined) data.isActive = isActive;

        const mutation = await prisma.sportMutation.update({
            where: { id },
            data,
        });

        return NextResponse.json(mutation);
    } catch (error) {
        console.error('Error updating mutation:', error);
        return NextResponse.json({ error: 'Failed to update mutation' }, { status: 500 });
    }
}
