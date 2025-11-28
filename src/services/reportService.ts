import prisma from "@/lib/db";
import { ReportType, Prisma } from "@prisma/client";

export const createReport = async (data: Prisma.ReportCreateInput) => {
    // Basic validation could go here, but Zod in API route is better
    return await prisma.report.create({
        data,
    });
};

export const getDailyReports = async (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await prisma.report.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
        include: {
            group: true,
        },
        orderBy: {
            date: "asc",
        },
    });
};

export const generateDailySummary = async (date: Date) => {
    const reports = await prisma.report.findMany({
        where: {
            date: {
                gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
                lte: new Date(new Date(date).setHours(23, 59, 59, 999)),
            },
        },
        include: {
            group: true,
            youth: true,
            indication: true,
            restriction: true,
        },
        orderBy: {
            createdAt: "asc",
        },
    });

    let summary = `Bij deze de sportrapportage,\n\n`;

    // 1. Group Reports (Type = SESSION or GENERAL or WARMING_UP, but usually SESSION for main report)
    // We filter for reports that have a Group but NO youth/indication/restriction specific focus, 
    // OR are explicitly marked as Group reports. 
    // The form will likely set type=SESSION for group reports.
    // 1. Group Reports
    const groupReports = reports.filter(r => r.type === 'SESSION' || r.type === 'WARMING_UP' || r.type === 'GENERAL');

    for (const r of groupReports) {
        const groupName = r.group?.name || "Onbekend";
        const youthCount = r.youthCount || 0;
        const glCount = r.leaderCount || 0;
        const warmingUp = r.warmingUp || "nvt";
        const sportmoment = r.activity || "nvt";
        const bijzonderheden = r.cleanedText || r.sessionSummary || r.notes || "Geen";

        summary += `Groep: ${groupName} (${youthCount} jongeren, ${glCount}-GL)\n\n`;
        summary += `Warming-up: ${warmingUp}\n`;
        summary += `Sportmoment: ${sportmoment}\n`;
        summary += `Bijzonderheden: ${bijzonderheden}\n\n`;
    }

    // 2. Indication Reports
    const indicationReports = reports.filter(r => r.type === "INDICATION");

    if (indicationReports.length > 0) {
        // summary += `--- INDICATIES ---\n\n`; // Optional separator
        for (const r of indicationReports) {
            const youthName = r.youth ? `${r.youth.firstName} ${r.youth.lastName}` : (r.rawText || "Onbekend");
            const warmingUp = r.warmingUp || "nvt";
            const sportmoment = r.activity || "nvt";
            const bijzonderheden = r.cleanedText || r.sessionSummary || "Geen";

            summary += `Indicatie – ${youthName}\n`;
            summary += `Warming-up: ${warmingUp}\n`;
            summary += `Sportmoment: ${sportmoment}\n`;
            summary += `Bijzonderheden: ${bijzonderheden}\n\n`;
        }
    }

    // 3. Restriction Reports
    const restrictionReports = reports.filter(r => r.type === "RESTRICTION");

    if (restrictionReports.length > 0) {
        // summary += `--- BEPERKINGEN ---\n\n`; // Optional separator
        for (const r of restrictionReports) {
            const youthName = r.youth ? `${r.youth.firstName} ${r.youth.lastName}` : (r.rawText || "Onbekend");
            const warmingUp = r.warmingUp || "nvt";
            const sportmoment = r.activity || "nvt";
            const bijzonderheden = r.cleanedText || r.sessionSummary || "Geen";

            summary += `Beperking – ${youthName}\n`;
            summary += `Warming-up: ${warmingUp}\n`;
            summary += `Sportmoment: ${sportmoment}\n`;
            summary += `Bijzonderheden: ${bijzonderheden}\n\n`;
        }
    }

    // 4. Incidents
    const incidents = reports.filter(r => r.isIncident || r.type === "INCIDENT");
    if (incidents.length > 0) {
        summary += `### INCIDENTEN\n`;
        for (const i of incidents) {
            summary += `- ${i.group?.name || 'Algemeen'}: ${i.cleanedText || i.sessionSummary || 'Geen details'}\n`;
        }
        summary += `\n`;
    }

    // Save DailySummary
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    return await prisma.dailySummary.upsert({
        where: { date: startOfDay },
        update: { content: summary, generatedAt: new Date() },
        create: { date: startOfDay, content: summary },
    });
};
