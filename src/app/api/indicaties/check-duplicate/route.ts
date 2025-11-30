import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Find youths with this name
        // Note: SQLite doesn't support mode: 'insensitive', so we use exact match for now
        // or we could fetch potential matches and filter in JS if needed.
        const youths = await prisma.youth.findMany({
            where: {
                firstName: { equals: firstName },
                lastName: { equals: lastName },
            },
            include: {
                indications: true
            }
        });

        // Collect all indications
        // Explicitly cast or handle the type if needed, but with include it should work.
        // If lint still complains, we can map safely.
        const allIndications = youths.flatMap((y: any) => y.indications || []);

        return NextResponse.json({
            exists: allIndications.length > 0,
            count: allIndications.length,
            indications: allIndications
        });

    } catch (error) {
        console.error("Error checking duplicate:", error);
        return NextResponse.json({ error: "Failed to check duplicate" }, { status: 500 });
    }
}
