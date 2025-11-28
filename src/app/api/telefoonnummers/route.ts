import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const numbers = await prisma.phoneNumber.findMany({
            orderBy: { department: 'asc' }
        });
        return NextResponse.json(numbers);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch phone numbers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { department, location, number, description } = body;

        const newNumber = await prisma.phoneNumber.create({
            data: {
                department,
                location,
                number,
                description
            }
        });

        return NextResponse.json(newNumber);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create phone number" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        const updatedNumber = await prisma.phoneNumber.update({
            where: { id },
            data
        });

        return NextResponse.json(updatedNumber);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update phone number" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 });
        }

        await prisma.phoneNumber.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete phone number" }, { status: 500 });
    }
}
