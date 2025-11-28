import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const loans = await prisma.loan.findMany({
            include: {
                book: true,
                group: true,
            },
            orderBy: { loanDate: "desc" },
        });
        return NextResponse.json(loans);
    } catch (error) {
        console.error("Error fetching loans:", error);
        return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookId, youthId, youthName, groupId, loanedBy, notes, startTime, endTime } = body;

        if (!bookId || !loanedBy) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Check availability
        const book = await prisma.book.findUnique({ where: { id: bookId } });
        if (!book || book.available < 1) {
            return NextResponse.json({ error: "Book not available" }, { status: 409 });
        }

        // Transaction: Create loan and decrement availability
        const result = await prisma.$transaction(async (tx) => {
            const loan = await tx.loan.create({
                data: {
                    bookId,
                    youthId,
                    youthName: youthName || "Onbekend",
                    groupId,
                    loanedBy,
                    notes,
                    status: "ACTIVE",
                    startTime: startTime ? new Date(startTime) : undefined,
                    endTime: endTime ? new Date(endTime) : undefined,
                },
            });

            await tx.book.update({
                where: { id: bookId },
                data: { available: { decrement: 1 } },
            });

            return loan;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating loan:", error);
        return NextResponse.json({ error: "Failed to create loan" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const body = await request.json(); // Expected: { status: "RETURNED" }

        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        if (body.status === "RETURNED") {
            const loan = await prisma.loan.findUnique({ where: { id } });
            if (!loan || loan.status !== "ACTIVE") {
                return NextResponse.json({ error: "Loan not active or not found" }, { status: 400 });
            }

            const result = await prisma.$transaction(async (tx) => {
                const updatedLoan = await tx.loan.update({
                    where: { id },
                    data: {
                        status: "RETURNED",
                        returnDate: new Date(),
                    },
                });

                await tx.book.update({
                    where: { id: loan.bookId },
                    data: { available: { increment: 1 } },
                });

                return updatedLoan;
            });
            return NextResponse.json(result);
        }

        return NextResponse.json({ error: "Invalid update" }, { status: 400 });
    } catch (error) {
        console.error("Error updating loan:", error);
        return NextResponse.json({ error: "Failed to update loan" }, { status: 500 });
    }
}
