import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";

// TODO: The Youth model doesn't have a needsRestorativeTalk field
// This functionality should be tracked via the RestorativeTalk model instead
const updateYouthSchema = z.object({
    id: z.string(),
    // needsRestorativeTalk: z.boolean().optional(), // Field doesn't exist
});

export async function PUT(request: Request) {
    // TODO: Implement proper youth update with actual fields from Youth model
    // Or remove this route if not needed
    return NextResponse.json({ error: "This endpoint is not implemented - Youth model doesn't have needsRestorativeTalk field" }, { status: 501 });

    /* Legacy implementation - removed
    try {
        const body = await request.json();
        const { id, ...data } = updateYouthSchema.parse(body);

        const youth = await prisma.youth.update({
            where: { id },
            data,
        });

        return NextResponse.json(youth);
    } catch (error) {
        console.error("Error updating youth:", error);
        return NextResponse.json(
            { error: "Failed to update youth" },
            { status: 500 }
        );
    }
    */
}
