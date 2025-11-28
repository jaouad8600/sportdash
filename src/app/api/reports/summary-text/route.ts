import { NextResponse } from "next/server";
import { generateDailySummary } from "@/services/reportService";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date } = body;

        if (!date) {
            return NextResponse.json({ error: "Date is required" }, { status: 400 });
        }

        const reportDate = new Date(date);

        // Generate the summary
        const summary = await generateDailySummary(reportDate);

        // Return the content directly
        return NextResponse.json({ text: summary.content });
    } catch (error) {
        console.error("Error generating summary text:", error);
        return NextResponse.json(
            { error: "Failed to generate summary" },
            { status: 500 }
        );
    }
}
