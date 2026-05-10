import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage, statusMessage } from "@/lib/telegram";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, assigneeId, customerId, category, priority } = body;

    // Durum değişikliği için eski durumu al
    let oldStatus: string | undefined;
    if (status !== undefined) {
      const current = await prisma.ticket.findUnique({ where: { id: Number(id) }, select: { status: true } });
      oldStatus = current?.status;
    }

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

    // Durum değiştiyse ve Telegram'dan geldiyse bildirim gönder
    if (status !== undefined && oldStatus !== status && ticket.telegramChatId) {
      await sendTelegramMessage(
        ticket.telegramChatId,
        statusMessage(ticket.id, ticket.subject, oldStatus!, status)
      );
    }

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
