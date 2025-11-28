import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Create a new evaluation for an indication
export async function POST(request: Request) {
    // TODO: This route uses legacy JSON evaluations - should use relational Evaluation model instead
    // See /api/indicaties/[id]/evaluaties/route.ts for the new implementation
    return NextResponse.json({ error: "This endpoint is deprecated - use /api/indicaties/[id]/evaluaties instead" }, { status: 410 });

    /* Legacy implementation - removed
    try {
        const body = await request.json();
        const { indicationId, notes, createdBy } = body;

        if (!indicationId || !notes) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if indication exists
        const indication = await prisma.sportIndication.findUnique({
            where: { id: indicationId },
            include: { evaluations: true },
        });

        if (!indication) {
            return NextResponse.json(
                { error: "Indication not found" },
                { status: 404 }
            );
        }

        // Create evaluation (stored in evaluations JSON field or separate table)
        const evaluation = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            notes,
            createdBy: createdBy || "Unknown",
        };

        // Get existing evaluations or initialize empty array
        const existingEvaluations = (indication.evaluations as any[]) || [];
        const updatedEvaluations = [...existingEvaluations, evaluation];

        // Update indication with new evaluation
        const updated = await prisma.sportIndication.update({
            where: { id: indicationId },
            data: {
                evaluations: updatedEvaluations as any,
            },
        });

        return NextResponse.json(evaluation, { status: 201 });
    } catch (error) {
        console.error("Error creating evaluation:", error);
        return NextResponse.json(
            { error: "Failed to create evaluation" },
            { status: 500 }
        );
    }
    */
}

// GET: Fetch all evaluations for an indication
export async function GET(request: Request) {
    // TODO: This route uses legacy JSON evaluations - should use relational Evaluation model instead
    // See /api/indicaties/[id]/evaluaties/route.ts for the new implementation
    return NextResponse.json({ error: "This endpoint is deprecated - use /api/indicaties/[id]/evaluaties instead" }, { status: 410 });

    /* Legacy implementation - removed
    try {
        const { searchParams } = new URL(request.url);
        const indicationId = searchParams.get("indicationId");

        if (!indicationId) {
            return NextResponse.json(
                { error: "indicationId is required" },
                { status: 400 }
            );
        }

        const indication = await prisma.sportIndication.findUnique({
            where: { id: indicationId },
            select: { evaluations: true },
        });

        if (!indication) {
            return NextResponse.json(
                { error: "Indication not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(indication.evaluations || []);
    } catch (error) {
        console.error("Error fetching evaluations:", error);
        return NextResponse.json(
            { error: "Failed to fetch evaluations" },
            { status: 500 }
        );
    }
    */
}
