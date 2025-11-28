import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const books = await prisma.book.findMany({
            orderBy: { title: "asc" },
            include: {
                loans: {
                    where: { status: "ACTIVE" },
                },
            },
        });
        return NextResponse.json(books);
    } catch (error) {
        console.error("Error fetching books:", error);
        return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, author, isbn, coverUrl, totalCopies, location } = body;

        if (!title || !author) {
            return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
        }

        const book = await prisma.book.create({
            data: {
                title,
                author,
                isbn,
                coverUrl,
                totalCopies: totalCopies || 1,
                available: totalCopies || 1,
                location,
            },
        });

        return NextResponse.json(book);
    } catch (error) {
        console.error("Error creating book:", error);
        return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const body = await request.json();

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const book = await prisma.book.update({
            where: { id },
            data: body,
        });

        return NextResponse.json(book);
    } catch (error) {
        console.error("Error updating book:", error);
        return NextResponse.json({ error: "Failed to update book" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        await prisma.book.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting book:", error);
        return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
    }
}
