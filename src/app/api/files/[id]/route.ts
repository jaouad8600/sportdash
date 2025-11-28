import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const file = await prisma.file.update({
            where: { id },
            data: { name },
        });

        return NextResponse.json(file);
    } catch (error) {
        console.error('Error renaming file:', error);
        return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const fileRecord = await prisma.file.findUnique({
            where: { id },
        });

        if (!fileRecord) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Delete from filesystem
        const filepath = path.join(process.cwd(), 'public', fileRecord.url);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        // Delete from database
        await prisma.file.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
