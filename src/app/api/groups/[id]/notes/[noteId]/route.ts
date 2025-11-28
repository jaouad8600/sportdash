import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/groups/[id]/notes/[noteId] - Update a note
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
    try {
        const { noteId } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content || content.trim() === "") {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        const note = await prisma.note.update({
            where: { id: noteId },
            data: { content: content.trim() },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error updating note:", error);
        return NextResponse.json(
            { error: "Failed to update note" },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id]/notes/[noteId] - Delete a note
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
    try {
        const { noteId } = await params;

        await prisma.note.delete({
            where: { id: noteId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting note:", error);
        return NextResponse.json(
            { error: "Failed to delete note" },
            { status: 500 }
        );
    }
}

// PATCH /api/groups/[id]/notes/[noteId] - Archive/unarchive a note
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; noteId: string }> }
) {
    try {
        const { noteId } = await params;
        const body = await request.json();
        const { archived } = body;

        const note = await prisma.note.update({
            where: { id: noteId },
            data: { archived: archived === true },
        });

        return NextResponse.json(note);
    } catch (error) {
        console.error("Error archiving note:", error);
        return NextResponse.json(
            { error: "Failed to archive note" },
            { status: 500 }
        );
    }
}
