import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "backup-config.json");

export async function GET() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
            return NextResponse.json(config);
        }
        return NextResponse.json({ schedule: "manual", cron: "" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // In a real app, we would update the crontab here using a library or exec
        // For this demo, we just save the preference to a file
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2));
        return NextResponse.json({ message: "Schedule updated" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
    }
}
