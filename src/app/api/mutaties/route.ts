import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('activeOnly') === 'true';
        const groupId = searchParams.get("groupId"); // Re-adding groupId filter

        const where: any = {};
        if (groupId) where.groupId = groupId;
        if (activeOnly) where.isActive = true;

        const mutations = await prisma.sportMutation.findMany({
            where,
            include: {
                group: true,
                youth: true,
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(mutations);
    } catch (error) {
        console.error('Error fetching mutations:', error);
        return NextResponse.json({ error: 'Failed to fetch mutations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupId, youthId, youthName, reason, reasonType, startDate, endDate, createdBy } = body;

        console.log("Received mutation data:", { groupId, youthName, reason, reasonType, startDate });

        if (!groupId || !reason || !startDate) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let finalYouthId = youthId;

        // If youthName is provided but no youthId, try to find or create youth
        if (youthName && !youthId) {
            const [firstName, ...lastNameParts] = youthName.trim().split(" ");
            const lastName = lastNameParts.join(" ");

            // Try to find existing youth (case-sensitive for SQLite compatibility)
            let youth = await prisma.youth.findFirst({
                where: {
                    firstName: firstName,
                    lastName: lastName || "",
                    groupId,
                },
            });

            // If not found, create new youth
            if (!youth) {
                youth = await prisma.youth.create({
                    data: {
                        firstName,
                        lastName: lastName || "",
                        groupId,
                    },
                });
            }

            finalYouthId = youth.id;
        }

        const mutation = await prisma.sportMutation.create({
            data: {
                groupId,
                youthId: finalYouthId || null,
                reason,
                reasonType: reasonType || "MEDICAL",  // Default to MEDICAL
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: !endDate, // Active if no end date
                createdBy: createdBy || "System",
            },
            include: {
                group: true,
                youth: true,
            },
        });

        return NextResponse.json(mutation);
    } catch (error: any) {
        console.error("Error creating mutation:", error);
        console.error("Error details:", error.message);
        return NextResponse.json({
            error: "Failed to create mutation",
            details: error.message
        }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, endDate, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        const mutation = await prisma.sportMutation.update({
            where: { id },
            data: {
                endDate: endDate ? new Date(endDate) : undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        });

        return NextResponse.json(mutation);
    } catch (error) {
        console.error("Error updating mutation:", error);
        return NextResponse.json({ error: "Failed to update mutation" }, { status: 500 });
    }
}
