import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { logAudit, AuditAction, AuditEntity } from "@/services/auditService";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headers = request.headers;
        const userId = headers.get("x-user-id") || "unknown-user";

        const {
            groupId,
            youthId,
            description,
            alarmPressed,
            afterCare,
            date,
            staffShare,
            deescalation,
            returnProcess,
            debriefing,
            restorativeAction,
            teamLeaderContact
        } = body;

        if (!description || !groupId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const incident = await prisma.incident.create({
            data: {
                groupId,
                youthId: youthId || null,
                description,
                alarmPressed: alarmPressed || false,
                afterCare: afterCare || null,
                date: date ? new Date(date) : new Date(),
                authorId: userId,
                staffShare: staffShare || null,
                deescalation: deescalation || null,
                returnProcess: returnProcess || null,
                debriefing: debriefing || null,
                restorativeAction: restorativeAction || null,
                teamLeaderContact: teamLeaderContact || null,
            },
        });

        // Audit Log
        await logAudit(
            AuditAction.CREATE,
            AuditEntity.INCIDENT,
            incident.id,
            userId,
            { groupId, youthId }
        );

        return NextResponse.json(incident);
    } catch (error) {
        console.error("Error creating incident:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId");

        const where: any = {};
        if (groupId) where.groupId = groupId;

        const incidents = await prisma.incident.findMany({
            where,
            include: {
                group: true,
                youth: true
            },
            orderBy: {
                date: 'desc'
            }
        });

        return NextResponse.json(incidents);
    } catch (error) {
        console.error("Error fetching incidents:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
