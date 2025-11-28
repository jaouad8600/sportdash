import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { format } from "date-fns";

export async function GET() {
    try {
        const limit = 5;

        // Fetch recent mutations
        const mutations = await prisma.sportMutation.findMany({
            take: limit,
            orderBy: { updatedAt: "desc" },
            include: { youth: true, group: true },
        });

        // Fetch recent indications
        const indications = await prisma.sportIndication.findMany({
            take: limit,
            orderBy: { updatedAt: "desc" },
            include: { youth: true, group: true },
        });

        // Fetch recent group updates
        const groups = await prisma.group.findMany({
            take: limit,
            orderBy: { updatedAt: "desc" },
        });

        // Fetch recent reports
        const reports = await prisma.report.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            include: { group: true },
        });

        const auditLogs = [
            ...mutations.map((m) => ({
                id: m.id,
                type: "MUTATION",
                action: m.createdAt.getTime() === m.updatedAt.getTime() ? "CREATE" : "UPDATE",
                title: `Sportmutatie ${m.reasonType}`,
                details: `${m.reason} voor ${m.youth?.firstName || "Onbekend"} ${m.youth?.lastName || ""} (${m.group.name})`,
                user: "Huidige Gebruiker", // In a real app, fetch user name
                timestamp: m.updatedAt,
            })),
            ...indications.map((i) => ({
                id: i.id,
                type: "INDICATION",
                action: i.createdAt.getTime() === i.updatedAt.getTime() ? "CREATE" : "UPDATE",
                title: `Indicatie ${i.type}`,
                details: `${i.description} voor ${i.youth?.firstName || "Onbekend"} ${i.youth?.lastName || ""} (${i.group.name})`,
                user: "Huidige Gebruiker",
                timestamp: i.updatedAt,
            })),
            ...groups.map((g) => ({
                id: g.id,
                type: "GROUP",
                action: g.createdAt.getTime() === g.updatedAt.getTime() ? "CREATE" : "UPDATE",
                title: `Groep ${g.name}`,
                details: `Status: ${g.status}, Kleur: ${g.color}`,
                user: "System",
                timestamp: g.updatedAt,
            })),
            ...reports.map((r: any) => ({
                id: r.id,
                type: "REPORT",
                action: "CREATE",
                title: `Rapportage ${r.group?.name || "Onbekend"}`,
                details: r.sessionSummary || "Geen samenvatting",
                user: r.author || "Onbekend",
                timestamp: r.createdAt,
            })),
        ];

        // Sort by timestamp descending
        auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json(auditLogs.slice(0, 20));
    } catch (error) {
        console.error("Failed to fetch audit logs", error);
        return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
    }
}
