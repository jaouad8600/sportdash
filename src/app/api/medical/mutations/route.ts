import { NextResponse } from "next/server";
import { createMutation, updateMutation, getActiveMutations } from "@/services/medicalService";
import { z } from "zod";
import { MutationReasonType } from "@prisma/client";
import prisma from "@/lib/db";

const createMutationSchema = z.object({
    youthName: z.string(),
    groupId: z.string(),
    reason: z.string(),
    reasonType: z.nativeEnum(MutationReasonType),
    startDate: z.string(), // ISO date string
    endDate: z.string().optional(), // ISO date string
});

const updateMutationSchema = z.object({
    id: z.string(),
    endDate: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId") || undefined;
        const dateStr = searchParams.get("date");
        const date = dateStr ? new Date(dateStr) : undefined;

        const mutations = await getActiveMutations(groupId, date);
        return NextResponse.json(mutations);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch mutations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headers = request.headers;
        const userId = headers.get("x-user-id") || "unknown";

        const validatedData = createMutationSchema.parse(body);

        // Parse youth name (format: "FirstName LastName")
        const nameParts = validatedData.youthName.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Find or create youth
        let youth = await prisma.youth.findFirst({
            where: {
                firstName: { equals: firstName },
                lastName: { equals: lastName },
                groupId: validatedData.groupId,
            },
        });

        if (!youth) {
            youth = await prisma.youth.create({
                data: {
                    firstName,
                    lastName,
                    groupId: validatedData.groupId,
                },
            });
        }

        const mutation = await createMutation({
            youthId: youth.id,
            groupId: validatedData.groupId,
            reason: validatedData.reason,
            reasonType: validatedData.reasonType,
            startDate: new Date(validatedData.startDate),
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
            createdBy: userId,
        });

        return NextResponse.json(mutation, { status: 201 });
    } catch (error) {
        console.error("Create mutation error:", error);
        return NextResponse.json({ error: "Failed to create mutation" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = updateMutationSchema.parse(body);

        const updateData: any = {};
        if (data.endDate) updateData.endDate = new Date(data.endDate);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const mutation = await updateMutation(id, updateData);
        return NextResponse.json(mutation);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update mutation" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing mutation ID" }, { status: 400 });
        }

        await prisma.sportMutation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete mutation error:", error);
        return NextResponse.json({ error: "Failed to delete mutation" }, { status: 500 });
    }
}
