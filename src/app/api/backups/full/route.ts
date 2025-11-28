import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

/**
 * POST /api/backups/full
 * Creates a full backup of the entire project (code + database)
 * Similar to the manual backup created in conversation b6597473
 */
export async function POST() {
    try {
        const projectRoot = path.resolve(process.cwd());
        const backupsDir = path.join(projectRoot, "backups");

        // Ensure backups directory exists
        if (!fs.existsSync(backupsDir)) {
            fs.mkdirSync(backupsDir, { recursive: true });
        }

        // Generate timestamp for backup filename
        const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const backupFilename = `sportdash-FULL-backup-${timestamp}.tgz`;
        const backupPath = path.join(backupsDir, backupFilename);

        // Create tar.gz archive excluding node_modules, .next, .git, and backups folder
        const excludePatterns = [
            "--exclude=node_modules",
            "--exclude=.next",
            "--exclude=.git",
            "--exclude=backups",
            "--exclude=*.log",
            "--exclude=.DS_Store"
        ].join(" ");

        const tarCommand = `tar ${excludePatterns} -czf "${backupPath}" -C "${path.dirname(projectRoot)}" "${path.basename(projectRoot)}"`;

        console.log("Creating full backup with command:", tarCommand);

        // Execute backup command with timeout
        await execAsync(tarCommand, {
            maxBuffer: 1024 * 1024 * 100, // 100MB buffer
            timeout: 300000 // 5 minutes timeout
        });

        // Verify backup was created
        if (!fs.existsSync(backupPath)) {
            throw new Error("Backup file was not created");
        }

        const stats = fs.statSync(backupPath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log(`Full backup created successfully: ${backupFilename} (${fileSizeMB} MB)`);

        return NextResponse.json({
            success: true,
            message: "Volledige backup succesvol aangemaakt",
            filename: backupFilename,
            size: stats.size,
            sizeMB: fileSizeMB,
            path: backupPath
        });

    } catch (error: any) {
        console.error("Error creating full backup:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Fout bij het maken van volledige backup",
                details: error.message
            },
            { status: 500 }
        );
    }
}
