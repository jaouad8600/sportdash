import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKUP_DIR = path.join(process.cwd(), "backups");

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("file");

    if (!fileName) {
        return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    // Prevent path traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    try {
        const fileBuffer = fs.readFileSync(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": "application/gzip",
                "Content-Disposition": `attachment; filename="${safeName}"`,
            },
        });
    } catch (error) {
        console.error("Error downloading backup:", error);
        return NextResponse.json({ error: "Failed to download backup" }, { status: 500 });
    }
}
