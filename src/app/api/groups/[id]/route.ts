import { NextResponse } from "next/server";
import { updateGroup } from "@/services/groupService";
import { z } from "zod";

const updateGroupSchema = z.object({
    name: z.string().min(2).optional(),
    color: z.string().optional(),
    department: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = updateGroupSchema.parse(body);
        const updatedGroup = await updateGroup(id, {
            ...validatedData,
            color: validatedData.color as any // Cast to any or import GroupColor
        });
        return NextResponse.json(updatedGroup);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }
}
