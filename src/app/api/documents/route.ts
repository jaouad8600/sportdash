import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile } from "fs/promises";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function GET() {
    try {
        const files = fs.readdirSync(UPLOAD_DIR).map(file => {
            const stats = fs.statSync(path.join(UPLOAD_DIR, file));
            return {
                name: file,
                size: stats.size,
                createdAt: stats.birthtime,
                url: `/uploads/${file}`
            };
        });
        return NextResponse.json(files);
    } catch (error) {
        return NextResponse.json({ error: "Failed to list files" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitize filename
        const filename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(UPLOAD_DIR, filename);

        await writeFile(filePath, buffer);

        return NextResponse.json({ success: true, filename });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) return NextResponse.json({ error: "Filename required" }, { status: 400 });

    try {
        const filePath = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
