import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const groupId = searchParams.get("groupId");

    // Case 1: Fetch stats for a group
    if (groupId) {
        try {
            const now = new Date();

            // Calculate ranges
            const startOfWeek = getMonday(now);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

            const startOfYear = new Date(now.getFullYear(), 0, 1);
            const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

            const [weekCount, monthCount, yearCount] = await Promise.all([
                prisma.extraSportMoment.count({
                    where: {
                        groupId,
                        status: "COMPLETED",
                        date: { gte: startOfWeek, lte: endOfWeek }
                    }
                }),
                prisma.extraSportMoment.count({
                    where: {
                        groupId,
                        status: "COMPLETED",
                        date: { gte: startOfMonth, lte: endOfMonth }
                    }
                }),
                prisma.extraSportMoment.count({
                    where: {
                        groupId,
                        status: "COMPLETED",
                        date: { gte: startOfYear, lte: endOfYear }
                    }
                })
            ]);

            return NextResponse.json({ weekCount, monthCount, yearCount });
        } catch (error) {
            console.error("Error fetching stats:", error);
            return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
        }
    }

    // Case 2: Fetch moments by date range
    if (!start || !end) {
        return NextResponse.json({ error: "Start and end dates required" }, { status: 400 });
    }

    try {
        const moments = await prisma.extraSportMoment.findMany({
            where: {
                date: {
                    gte: new Date(start),
                    lte: new Date(end),
                },
            },
        });
        return NextResponse.json(moments);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch moments" }, { status: 500 });
    }
}

function getMonday(d: Date) {
    d = new Date(d);
    const day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupId, date, status = "COMPLETED" } = body;

        // Ensure we save the date at noon UTC to avoid timezone shifts
        // date is expected to be "YYYY-MM-DD"
        const dateObj = new Date(`${date}T12:00:00Z`);

        const moment = await prisma.extraSportMoment.create({
            data: {
                groupId,
                date: dateObj,
                status,
            },
        });

        return NextResponse.json(moment);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create moment" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "ID and status required" }, { status: 400 });
        }

        const moment = await prisma.extraSportMoment.update({
            where: { id },
            data: { status },
        });

        return NextResponse.json(moment);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update moment" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    try {
        await prisma.extraSportMoment.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete moment" }, { status: 500 });
    }
}
