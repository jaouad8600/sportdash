import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const monthParam = searchParams.get("month"); // Format: YYYY-MM
        const dayParam = searchParams.get("day"); // Format: YYYY-MM-DD

        let startDate: Date;
        let endDate: Date;

        if (dayParam) {
            // Get events for a specific day
            const day = new Date(dayParam);
            startDate = startOfDay(day);
            endDate = endOfDay(day);
        } else if (monthParam) {
            // Get events for a month
            const [year, month] = monthParam.split("-").map(Number);
            const date = new Date(year, month - 1, 1);
            startDate = startOfMonth(date);
            endDate = endOfMonth(date);
        } else {
            // Default to current month
            startDate = startOfMonth(new Date());
            endDate = endOfMonth(new Date());
        }

        // Fetch all relevant data for the date range
        const [reports, extraSportMoments, mutations, indications] = await Promise.all([
            // Reports
            prisma.report.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    group: true,
                },
                orderBy: { date: "asc" },
            }),

            // Sport Sessions removed as model is deprecated

            // Extra Sport Moments
            prisma.extraSportMoment.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    group: true,
                },
                orderBy: { date: "asc" },
            }),

            // Active Mutations
            prisma.sportMutation.findMany({
                where: {
                    OR: [
                        {
                            startDate: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                        {
                            AND: [
                                { startDate: { lte: endDate } },
                                {
                                    OR: [
                                        { endDate: null },
                                        { endDate: { gte: startDate } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                include: {
                    youth: true,
                    group: true,
                },
                orderBy: { startDate: "asc" },
            }),

            // Active Indications
            prisma.sportIndication.findMany({
                where: {
                    OR: [
                        {
                            validFrom: {
                                gte: startDate,
                                lte: endDate,
                            },
                        },
                        {
                            AND: [
                                { validFrom: { lte: endDate } },
                                {
                                    OR: [
                                        { validUntil: null },
                                        { validUntil: { gte: startDate } },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                include: {
                    youth: true,
                    group: true,
                },
                orderBy: { validFrom: "asc" },
            }),
        ]);

        // Format the response
        const events = {
            reports: reports.map(r => ({
                id: r.id,
                type: "report",
                date: r.date,
                title: `Rapportage - ${r.group?.name || "Algemeen"}`,
                group: r.group,
                data: r,
            })),
            sessions: [],
            extraSport: extraSportMoments.map(e => ({
                id: e.id,
                type: "extraSport",
                date: e.date,
                title: `Extra Sport - ${e.group?.name}`,
                group: e.group,
                data: e,
            })),
            mutations: mutations.map(m => ({
                id: m.id,
                type: "mutation",
                startDate: m.startDate,
                endDate: m.endDate,
                title: `Mutatie - ${m.youth?.firstName || "Onbekend"} ${m.youth?.lastName || ""}`,
                youth: m.youth,
                group: m.group,
                data: m,
            })),
            indications: indications.map(i => ({
                id: i.id,
                type: "indication",
                startDate: i.validFrom,
                endDate: i.validUntil,
                title: `Indicatie - ${i.youth?.firstName || "Onbekend"} ${i.youth?.lastName || ""}`,
                youth: i.youth,
                group: i.group,
                data: i,
            })),
        };

        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 });
    }
}
