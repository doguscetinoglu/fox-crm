import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assigneeId, customerId, category, priority } = body;

    const ticket = await prisma.ticket.update({
      where: { id: Number(id) },
      data: {
        ...(status !== undefined && { status }),
        ...(assigneeId !== undefined && { assigneeId: assigneeId === null ? null : Number(assigneeId) }),
        ...(customerId !== undefined && { customerId: customerId === null ? null : Number(customerId) }),
        ...(category !== undefined && { category }),
        ...(priority !== undefined && { priority }),
      },
      include: { assignee: true, customer: true },
    });

    return NextResponse.json(ticket);
  } catch (err) {
    console.error("PATCH ticket error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.ticket.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE ticket error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
