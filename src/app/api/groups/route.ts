import { NextResponse } from "next/server";
import { getGroups, createGroup } from "@/services/groupService";
import { z } from "zod";

const createGroupSchema = z.object({
    name: z.string().min(2),
    color: z.enum(["GROEN", "GEEL", "ORANJE", "ROOD"]).optional(),
    department: z.string().optional(),
});

export async function GET() {
    try {
        const groups = await getGroups();
        return NextResponse.json(groups);
    } catch (error) {
        console.error("GET /api/groups error:", error);
        return NextResponse.json({ error: "Failed to fetch groups", details: String(error) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = createGroupSchema.parse(body);

        // Cast to any to bypass strict type check for now, or import GroupColor from client
        const groupData: any = {
            ...validatedData,
            color: validatedData.color as any
        };

        const group = await createGroup(groupData);
        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: (error as z.ZodError).issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
    }
}

const updateGroupSchema = z.object({
    id: z.string(),
    name: z.string().min(2).optional(),
    color: z.enum(["GROEN", "GEEL", "ORANJE", "ROOD"]).optional(),
    needsRestorativeTalk: z.boolean().optional(),
});

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = updateGroupSchema.parse(body);

        // Import dynamically to avoid circular deps if any, or just use the service
        const { updateGroup } = await import("@/services/groupService");

        const group = await updateGroup(id, data);
        return NextResponse.json(group);
    } catch (error) {
        console.error("Update group error:", error);
        return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
    }
}
