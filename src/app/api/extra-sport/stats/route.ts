import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
        return NextResponse.json({ error: "GroupId required" }, { status: 400 });
    }

    const now = new Date();

    try {
        const [weekCount, monthCount, yearCount] = await Promise.all([
            prisma.extraSportMoment.count({
                where: {
                    groupId,
                    date: {
                        gte: startOfWeek(now, { weekStartsOn: 1 }),
                        lte: endOfWeek(now, { weekStartsOn: 1 }),
                    },
                },
            }),
            prisma.extraSportMoment.count({
                where: {
                    groupId,
                    date: {
                        gte: startOfMonth(now),
                        lte: endOfMonth(now),
                    },
                },
            }),
            prisma.extraSportMoment.count({
                where: {
                    groupId,
                    date: {
                        gte: startOfYear(now),
                        lte: endOfYear(now),
                    },
                },
            }),
        ]);

        return NextResponse.json({
            week: weekCount,
            month: monthCount,
            year: yearCount,
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
