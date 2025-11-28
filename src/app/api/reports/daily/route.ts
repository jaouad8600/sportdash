import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { reports, action, previewText, authorName } = body;

        if (!reports || !Array.isArray(reports)) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const savedReports = [];

        // If action is OWN_VERSION, we might want to tag it or just save it.
        // For now, we just save it as a regular report but ensure author is set.
        // The requirement "Eigen versie opslaan" implies saving it for the user.
        // Since we don't have a separate "MyReports" table, saving as a regular report is fine,
        // but maybe we should add a note or handle it differently if needed.
        // For now, standard save is sufficient as it will appear in the dashboard.

        // Save each report
        // Note: SQLite doesn't support createMany with relations easily in some Prisma versions, 
        // so we'll loop for safety and to handle individual logic if needed.
        for (const report of reports) {
            let rawText = (report.type === 'INDICATION' || report.type === 'RESTRICTION')
                ? report.youthName
                : `Warming-up: ${report.warmingUp}\nSportmoment: ${report.activity}\nBijzonderheden: ${report.notes}`;

            if (report.type === 'INDICATION' && report.evaluation) {
                rawText += `\nEvaluatie: ${report.evaluation}`;
            }

            const savedReport = await prisma.report.create({
                data: {
                    groupId: report.groupId,
                    youthCount: report.type === 'SESSION' ? report.youthCount : 0,
                    leaderCount: report.type === 'SESSION' ? report.glCount : 0,
                    warmingUp: report.warmingUp,
                    activity: report.activity,
                    cleanedText: report.notes, // Bijzonderheden
                    rawText: rawText,
                    type: report.type, // SESSION, INDICATION, RESTRICTION

                    // Save author
                    author: authorName || "Onbekend",

                    archived: action === 'ARCHIVE',
                    date: new Date(),
                },
            });

            // Handle Evaluation creation if possible
            if (report.type === 'INDICATION' && report.evaluation) {
                try {
                    // 1. Try to find the youth by name in this group
                    // This is a best-effort fuzzy match since we only have a name string
                    const youths = await prisma.youth.findMany({
                        where: { groupId: report.groupId },
                    });

                    const matchedYouth = youths.find(y =>
                        report.youthName.toLowerCase().includes(y.firstName.toLowerCase()) ||
                        (y.lastName && report.youthName.toLowerCase().includes(y.lastName.toLowerCase()))
                    );

                    if (matchedYouth) {
                        // 2. Find active indication for this youth
                        const indication = await prisma.sportIndication.findFirst({
                            where: {
                                youthId: matchedYouth.id,
                                isActive: true,
                            },
                        });

                        if (indication) {
                            // 3. Create Evaluation record
                            await prisma.evaluation.create({
                                data: {
                                    indicationId: indication.id,
                                    summary: report.evaluation,
                                    author: authorName || "Onbekend",
                                    date: new Date(),
                                },
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to link evaluation to indication:", err);
                    // Continue, don't fail the whole request
                }
            }

            savedReports.push(savedReport);
        }

        // Save Daily Summary if we have preview text
        if (previewText) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            await prisma.dailySummary.upsert({
                where: { date: today },
                update: {
                    content: previewText,
                    generatedAt: new Date(),
                },
                create: {
                    date: today,
                    content: previewText,
                },
            });
        }

        // Mock Email Sending
        if (action === "MAIL") {
            console.log("---------------------------------------------------");
            console.log("📧 MOCK EMAIL SENT");
            console.log("To: Teamleiders, AV");
            console.log("Subject: Sportrapportage " + new Date().toLocaleDateString("nl-NL"));
            console.log("Body:");
            console.log(previewText);
            console.log("---------------------------------------------------");
        }

        return NextResponse.json({ success: true, count: savedReports.length });
    } catch (error) {
        console.error("Error saving daily reports:", error);
        return NextResponse.json(
            { error: "Failed to save reports" },
            { status: 500 }
        );
    }
}
