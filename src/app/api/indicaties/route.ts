import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");
    const archived = searchParams.get("archived") === "true";

    try {
        const where: any = {};
        if (groupId) where.groupId = groupId;

        // If archived is requested, show inactive. Otherwise show active.
        where.isActive = !archived;

        const indications = await prisma.sportIndication.findMany({
            where,
            include: {
                group: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                youth: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                    },
                },
                evaluations: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        summary: true,
                        date: true,
                        author: true,
                        emailedAt: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(indications);
    } catch (error) {
        console.error("Error fetching indications:", error);
        return NextResponse.json({ error: "Failed to fetch indications" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupId, youthId, youthName, description, type, validFrom, validUntil, issuedBy } = body;

        if (!groupId || !description || !type || !validFrom) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let finalYouthId = youthId;

        // If youthName is provided but no youthId, find or create the youth
        if (!finalYouthId && youthName) {
            const nameParts = youthName.trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            let youth = await prisma.youth.findFirst({
                where: {
                    firstName: { equals: firstName },
                    lastName: { equals: lastName },
                    groupId: groupId,
                },
            });

            if (!youth) {
                youth = await prisma.youth.create({
                    data: {
                        firstName,
                        lastName,
                        groupId,
                    },
                });
            }
            finalYouthId = youth.id;
        }

        const indication = await prisma.sportIndication.create({
            data: {
                groupId,
                youthId: finalYouthId || null,
                description,
                type,
                validFrom: new Date(validFrom),
                validUntil: validUntil ? new Date(validUntil) : null,
                isActive: true,
                issuedBy: issuedBy || "System",
            },
        });

        return NextResponse.json(indication);
    } catch (error) {
        console.error("Error creating indication:", error);
        return NextResponse.json({ error: "Failed to create indication" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, validUntil, isActive, evaluations } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const data: any = {};
        if (validUntil) data.validUntil = new Date(validUntil);
        if (isActive !== undefined) data.isActive = isActive;
        if (evaluations) data.evaluations = evaluations;

        const indication = await prisma.sportIndication.update({
            where: { id },
            data,
        });

        return NextResponse.json(indication);
    } catch (error) {
        console.error("Error updating indication:", error);
        return NextResponse.json({ error: "Failed to update indication" }, { status: 500 });
    }
}
