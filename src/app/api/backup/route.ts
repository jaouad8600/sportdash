import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const BACKUP_DIR = path.join(process.cwd(), "backups");

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function GET() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith(".db") || file.endsWith(".zip") || file.endsWith(".tgz"))
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `backup-${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Use SQLite VACUUM INTO for a safe hot backup
    // This requires SQLite 3.27.0+ (2019) which Node 18+ should have
    await prisma.$executeRawUnsafe(`VACUUM INTO '${backupPath}'`);

    return NextResponse.json({ message: "Backup created", name: backupName });
  } catch (error) {
    console.error("Error creating backup:", error);

    // Fallback if VACUUM INTO fails (e.g. permission issues or old sqlite)
    try {
      const DB_PATH = path.join(process.cwd(), "prisma", "dev.db");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupName = `backup-fallback-${timestamp}.db`;
      const backupPath = path.join(BACKUP_DIR, backupName);
      fs.copyFileSync(DB_PATH, backupPath);
      return NextResponse.json({ message: "Backup created (fallback)", name: backupName });
    } catch (fallbackError) {
      console.error("Fallback backup failed:", fallbackError);
      return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
    }
  }
}
