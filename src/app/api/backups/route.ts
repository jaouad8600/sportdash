import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function GET() {
    try {
        const files = fs.readdirSync(BACKUP_DIR)
            .filter(file => file.endsWith(".tgz"))
            .map(file => {
                const stats = fs.statSync(path.join(BACKUP_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                };
            })
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json(files);
    } catch (error) {
        console.error("Error listing backups:", error);
        return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
    }
}

export async function POST() {
    try {
        // Execute the backup script
        const scriptPath = path.join(process.cwd(), "scripts", "backup.js");
        const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);

        console.log("Backup stdout:", stdout);
        if (stderr) console.error("Backup stderr:", stderr);

        return NextResponse.json({ message: "Backup created successfully" });
    } catch (error: any) {
        console.error("Error creating backup:", error);
        return NextResponse.json({
            error: "Failed to create backup",
            details: error.message
        }, { status: 500 });
    }
}
