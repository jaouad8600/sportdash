import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel');

    if (!channel) {
        return NextResponse.json({ error: 'Channel is required' }, { status: 400 });
    }

    try {
        const messages = await prisma.chatMessage.findMany({
            where: { channel },
            orderBy: { createdAt: 'asc' },
            take: 100, // Limit to last 100 messages
        });
        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { channel, sender, content } = body;

        if (!channel || !sender || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const message = await prisma.chatMessage.create({
            data: {
                channel,
                sender,
                content,
            },
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error('Error creating chat message:', error);
        return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}
