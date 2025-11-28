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

        // Mock Email Sending
        console.log("---------------------------------------------------");
        console.log("📧 MOCK EMAIL SENT - DAILY SUMMARY");
        console.log("Date:", reportDate.toLocaleDateString("nl-NL"));
        console.log("To: Teamleiders, AV");
        console.log("Subject: Dagrapportage " + reportDate.toLocaleDateString("nl-NL"));
        console.log("Body:");
        console.log(summary.content);
        console.log("---------------------------------------------------");

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error mailing summary:", error);
        return NextResponse.json(
            { error: "Failed to mail summary" },
            { status: 500 }
        );
    }
}
