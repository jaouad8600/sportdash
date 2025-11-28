import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reason, reasonType, startDate, endDate, isActive } = body;

    const data: any = {};
    if (reason) data.reason = reason;
    if (reasonType) data.reasonType = reasonType;
    if (startDate) data.startDate = new Date(startDate);
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
    if (isActive !== undefined) data.isActive = isActive;

    const mutation = await prisma.sportMutation.update({
      where: { id },
      data,
    });

    return NextResponse.json(mutation);
  } catch (error) {
    console.error('Error updating mutation:', error);
    return NextResponse.json({ error: 'Failed to update mutation' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.sportMutation.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mutation:', error);
    return NextResponse.json({ error: 'Failed to delete mutation' }, { status: 500 });
  }
}
