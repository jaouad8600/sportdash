import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");

export async function POST(request: Request) {
    try {
        const { filename } = await request.json();

        if (!filename) {
            return NextResponse.json({ error: "Filename required" }, { status: 400 });
        }

        const backupPath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(backupPath)) {
            return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
        }

        // 1. Create a temporary directory for extraction
        const tempDir = path.join(process.cwd(), "tmp_restore_" + Date.now());
        fs.mkdirSync(tempDir);

        try {
            // 2. Extract the archive
            // We assume the archive was created with 'tar -czf ... .' from root
            // So extracting it will recreate the structure
            await execAsync(`tar -xzf "${backupPath}" -C "${tempDir}"`);

            // 3. Locate the database file in the extracted content
            // It should be at tempDir/prisma/dev.db
            const extractedDbPath = path.join(tempDir, "prisma", "dev.db");

            if (!fs.existsSync(extractedDbPath)) {
                throw new Error("Database file not found in backup archive");
            }

            // 4. Backup current DB just in case (safety net)
            const safetyBackup = `${DB_PATH}.pre-restore-${Date.now()}`;
            if (fs.existsSync(DB_PATH)) {
                fs.copyFileSync(DB_PATH, safetyBackup);
            }

            // 5. Replace the database
            // We might need to stop Prisma client connection here in a real app, 
            // but in dev/simple setup, file replacement usually works for SQLite 
            // if no active write transaction is happening.
            fs.copyFileSync(extractedDbPath, DB_PATH);

            console.log(`Restored DB from ${filename}. Safety backup at ${safetyBackup}`);

            return NextResponse.json({ message: "Database restored successfully. Please restart the server if you encounter issues." });

        } finally {
            // Cleanup temp dir
            fs.rmSync(tempDir, { recursive: true, force: true });
        }

    } catch (error: any) {
        console.error("Restore failed:", error);
        return NextResponse.json({ error: "Restore failed", details: error.message }, { status: 500 });
    }
}
