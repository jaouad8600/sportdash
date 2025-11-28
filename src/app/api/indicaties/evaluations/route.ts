import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { indicationId, notes, createdBy } = body;

        if (!indicationId || !notes) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const evaluation = await prisma.evaluation.create({
            data: {
                indicationId,
                summary: notes,
                author: createdBy || "System",
            },
        });

        return NextResponse.json(evaluation);
    } catch (error) {
        console.error("Error creating evaluation:", error);
        return NextResponse.json({ error: "Failed to create evaluation" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { ids, emailedAt } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "IDs array required" }, { status: 400 });
        }

        await prisma.evaluation.updateMany({
            where: {
                id: { in: ids },
            },
            data: {
                emailedAt: emailedAt ? new Date(emailedAt) : new Date(),
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating evaluations:", error);
        return NextResponse.json({ error: "Failed to update evaluations" }, { status: 500 });
    }
}
