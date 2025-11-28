import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reports, action } = body; // action: 'SAVE', 'ARCHIVE', 'EMAIL'

        // Generate text format
        const generatedText = reports.map((r: any) => `
Groep: ${r.groupName} (${r.youthCount}- jongeren, ${r.glCount} GL)

Warming-up: ${r.warmingUp || 'n.v.t'}
Sportmoment: ${r.activity || 'n.v.t'}
Bijzonderheden: ${r.notes || 'Geen bijzonderheden'}
`).join('\n');

        if (action === 'EMAIL') {
            // Mock email sending
            console.log("SENDING EMAIL TO: teamleider@teylingereind.nl");
            console.log("SUBJECT: Sportrapportage " + new Date().toLocaleDateString());
            console.log("BODY:\n" + generatedText);

            // In a real app, use nodemailer or similar here
        }

        // Save to database (as DailySummary or individual reports)
        // For now, we'll log it as a DailySummary
        await prisma.dailySummary.create({
            data: {
                date: new Date(),
                content: generatedText,
                sentTo: action === 'EMAIL' ? "teamleider@teylingereind.nl" : null
            }
        });

        return NextResponse.json({ success: true, text: generatedText });

    } catch (error) {
        console.error("Error processing report:", error);
        return NextResponse.json({ error: "Failed to process report" }, { status: 500 });
    }
}
