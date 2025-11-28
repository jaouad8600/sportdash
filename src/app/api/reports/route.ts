import { NextResponse } from "next/server";
import { createReport, getDailyReports } from "@/services/reportService";
import { z } from "zod";
import { ReportType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditAction, AuditEntity } from "@/services/auditService";

const createReportSchema = z.object({
    groupId: z.string().optional(),
    content: z.string().min(5),
    type: z.nativeEnum(ReportType),
    isIncident: z.boolean().optional(),
    author: z.string().optional(),
    parsedData: z.string().optional(), // JSON string
    youthCount: z.number().optional(),
});

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get("date");
        const groupId = searchParams.get("groupId");
        const archivedParam = searchParams.get("archived");

        const where: any = {};

        if (dateParam) {
            const date = new Date(dateParam);
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            where.date = { gte: start, lte: end };
        }

        if (groupId) {
            where.groupId = groupId;
        }

        if (archivedParam !== null) {
            where.archived = archivedParam === 'true';
        } else {
            // Default to not archived if not specified, unless filtering by specific ID/Group where we might want all
            // But for general list, usually we want active. 
            // Let's default to active if not specified.
            where.archived = false;
        }

        const reports = await prisma.report.findMany({
            where,
            include: {
                group: true,
            },
            orderBy: {
                date: 'desc',
            },
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const headers = request.headers;
        const userId = headers.get("x-user-id") || "unknown-user";

        console.log("Creating report with body:", JSON.stringify(body, null, 2));

        // Extract youthCount to update Group, remove from report data if not in Report model
        const {
            groupId,
            content,
            date,
            type,
            parsedData,
            youthCount,
            leaderCount,
            warmingUp,
            activity,
            rawText,
            parsedAt,
            parsedBy,
            confidenceScore
        } = body;

        // Validate required fields
        if (!groupId || !content) {
            console.error("Missing required fields: groupId or content");
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Handle parsedData: if it's already a string (from frontend JSON.stringify), use it.
        // If it's an object, stringify it.
        let finalParsedData = null;
        if (parsedData) {
            finalParsedData = typeof parsedData === 'string' ? parsedData : JSON.stringify(parsedData);
        }

        // Create the report
        const report = await prisma.report.create({
            data: {
                groupId,
                cleanedText: content, // Map content to cleanedText in schema (bijzonderheden)
                youthCount: youthCount || 0,
                leaderCount: leaderCount || 0,
                warmingUp: warmingUp || null,
                activity: activity || null,
                date: date ? new Date(date) : new Date(),
                type: type || "SESSION",
                parsedData: finalParsedData,
                rawText,
                parsedAt: parsedAt ? new Date(parsedAt) : null,
                parsedBy,
                confidenceScore,
                authorId: userId, // Store author ID
            },
        });

        console.log("Report created successfully:", report.id);

        // Update group youth count if provided
        if (youthCount !== undefined) {
            await prisma.group.update({
                where: { id: groupId },
                data: { youthCount },
            });
        }

        // Audit Log
        await logAudit(
            AuditAction.CREATE,
            AuditEntity.REPORT,
            report.id,
            userId,
            { groupId: groupId, type: type }
        );

        return NextResponse.json(report);
    } catch (error: any) {
        console.error("Error creating report:", error);
        // Return the actual error message for debugging
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, archived, content, summary } = body;

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }

        const updateData: any = {};
        if (archived !== undefined) updateData.archived = archived;
        if (content !== undefined) updateData.cleanedText = content;
        // Summary is not in schema directly (it's likely in parsedData or sessionSummary), 
        // but checking schema: Report has sessionSummary String?
        if (summary !== undefined) updateData.sessionSummary = summary;

        const report = await prisma.report.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(report);
    } catch (error) {
        console.error("Error updating report:", error);
        return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
    }
}
