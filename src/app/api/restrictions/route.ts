import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId");
        const youthId = searchParams.get("youthId");

        const where: any = { isActive: true };
        if (groupId) where.groupId = groupId;
        if (youthId) where.youthId = youthId;

        const restrictions = await prisma.restriction.findMany({
            where,
            include: {
                youth: true,
                group: true
            },
            orderBy: { startDate: 'desc' }
        });

        return NextResponse.json(restrictions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch restrictions" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { youthId, groupId, reason, startDate, endDate } = body;

        const restriction = await prisma.restriction.create({
            data: {
                youthId,
                groupId,
                reason,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                isActive: true
            }
        });

        return NextResponse.json(restriction);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create restriction" }, { status: 500 });
    }
}
