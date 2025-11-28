
import { logger } from "@/lib/logger";

export interface IncidentData {
    type: string;
    description: string;
    involvedYouth: string[];
    actionTaken: string;
}

export interface ParsedReport {
    group: string;
    presentYouth: number;
    leaderCount?: number;
    warmingUp?: string;
    activity?: string;
    atmosphere: string;
    sessionSummary: string;
    incidents: IncidentData[];
    planForTomorrow?: string;
    rawText: string;
    parsedAt: string;
    parsedBy: string;
    confidenceScore: number;
}

export async function parseReportText(text: string, groupName: string = "Unknown"): Promise<ParsedReport> {
    // Mock AI parsing logic - in production this would call OpenAI/Claude
    // Simulating a delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    logger.info("Parsing report text", { groupName, textLength: text.length });

    const isNegative = text.toLowerCase().includes("incident") || text.toLowerCase().includes("ruzie") || text.toLowerCase().includes("vechten");

    const incidents: IncidentData[] = [];
    if (isNegative) {
        incidents.push({
            type: "Fysiek Geweld",
            description: "Ruzie tijdens het voetballen die uit de hand liep.",
            involvedYouth: ["Jantje", "Pietje"],
            actionTaken: "Gesprek gevoerd en uit elkaar gehaald."
        });
    }

    return {
        group: groupName,
        presentYouth: Math.floor(Math.random() * 5) + 5, // Mock count 5-10
        leaderCount: 2,
        warmingUp: "Rondje rennen",
        activity: "Voetbal",
        atmosphere: isNegative ? "Onrustig" : "Gezellig en actief",
        sessionSummary: text.length > 100 ? text.substring(0, 100) + "..." : text,
        incidents: incidents,
        planForTomorrow: "Verder met techniek training",
        rawText: text,
        parsedAt: new Date().toISOString(),
        parsedBy: "AI-Model-v1",
        confidenceScore: 0.85 + (Math.random() * 0.1)
    };
}
