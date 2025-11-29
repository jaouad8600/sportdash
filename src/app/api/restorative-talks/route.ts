
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RestorativeTalkStatus } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as RestorativeTalkStatus | 'all' | null;

        const whereClause: any = {
            archived: false,
        };

        if (status && status !== 'all') {
            whereClause.status = status;
        } else if (!status) {
            // Default to pending AND failed (so failed talks can be retried)
            whereClause.status = {
                in: [RestorativeTalkStatus.PENDING, RestorativeTalkStatus.FAILED]
            };
        }
        // If status === 'all', don't filter by status at all

        const talks = await prisma.restorativeTalk.findMany({
            where: whereClause,
            include: {
                group: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(talks);
    } catch (error) {
        console.error('Error fetching restorative talks:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupId, youthName, reason, createdBy } = body;

        if (!groupId || !youthName) {
            return NextResponse.json({ error: 'Vul alle verplichte velden in' }, { status: 400 });
        }

        const talk = await prisma.restorativeTalk.create({
            data: {
                groupId,
                youthName,
                reason,
                createdBy,
                status: RestorativeTalkStatus.PENDING,
            },
        });

        return NextResponse.json(talk);
    } catch (error) {
        console.error('Error creating restorative talk:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status, failureReason } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (failureReason !== undefined) updateData.failureReason = failureReason;
        if (status === RestorativeTalkStatus.COMPLETED) {
            updateData.completedAt = new Date();
        }

        const talk = await prisma.restorativeTalk.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(talk);
    } catch (error) {
        console.error('Error updating restorative talk:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is verplicht' }, { status: 400 });
        }

        const talk = await prisma.restorativeTalk.update({
            where: { id },
            data: { archived: true },
        });

        return NextResponse.json(talk);
    } catch (error) {
        console.error('Error archiving restorative talk:', error);
        return NextResponse.json({ error: 'Er is iets misgegaan' }, { status: 500 });
    }
}
