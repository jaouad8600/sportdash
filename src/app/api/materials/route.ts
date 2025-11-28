import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const materials = await prisma.material.findMany({
            orderBy: { name: "asc" },
        });
        return NextResponse.json(materials);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch materials" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const material = await prisma.material.create({
            data: {
                name: body.name,
                category: body.category,
                quantityTotal: body.quantityTotal,
                quantityUsable: body.quantityUsable,
                location: body.location, // KORTVERBLIJF or LANGVERBLIJF
                subLocation: body.subLocation,
                imageUrl: body.imageUrl,
                conditionStatus: body.conditionStatus || "GOED",
                description: body.description,
            },
        });
        return NextResponse.json(material);
    } catch (error) {
        console.error("Create material error:", error);
        return NextResponse.json({ error: "Failed to create material" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing material ID" }, { status: 400 });
        }

        const body = await request.json();
        const material = await prisma.material.update({
            where: { id },
            data: {
                name: body.name,
                category: body.category,
                quantityTotal: body.quantityTotal,
                quantityUsable: body.quantityUsable,
                location: body.location,
                subLocation: body.subLocation,
                imageUrl: body.imageUrl,
                conditionStatus: body.conditionStatus,
                description: body.description,
            },
        });
        return NextResponse.json(material);
    } catch (error) {
        console.error("Update material error:", error);
        return NextResponse.json({ error: "Failed to update material" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing material ID" }, { status: 400 });
        }

        await prisma.material.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete material error:", error);
        return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }
}
