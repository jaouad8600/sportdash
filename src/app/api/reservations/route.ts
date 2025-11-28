import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date");
        const resourceId = searchParams.get("resourceId");

        const where: any = {};
        if (date) {
            // Filter by day (start of day to end of day)
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            where.startTime = {
                gte: start,
                lte: end,
            };
        }
        if (resourceId) {
            where.resourceId = resourceId;
        }

        const reservations = await prisma.reservation.findMany({
            where,
            include: { group: true },
            orderBy: { startTime: "asc" },
        });

        return NextResponse.json(reservations);
    } catch (error) {
        console.error("Error fetching reservations:", error);
        return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { resourceId, resourceName, userId, userName, startTime, endTime, title, description, groupId } = body;

        // Basic validation
        if (!resourceId || !startTime || !endTime || !userId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
        }

        // Check for overlaps
        const overlap = await prisma.reservation.findFirst({
            where: {
                resourceId,
                OR: [
                    {
                        startTime: { lt: end },
                        endTime: { gt: start },
                    },
                ],
            },
        });

        if (overlap) {
            return NextResponse.json({ error: "Er bestaat al een reservering voor deze ruimte in dit tijdvak." }, { status: 409 });
        }

        const reservation = await prisma.reservation.create({
            data: {
                resourceId,
                resourceName,
                userId,
                userName,
                groupId,
                startTime: start,
                endTime: end,
                title,
                description,
            },
        });

        return NextResponse.json(reservation);
    } catch (error) {
        console.error("Error creating reservation:", error);
        return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        await prisma.reservation.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
    }
}
