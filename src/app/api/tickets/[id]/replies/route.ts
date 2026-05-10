import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendTelegramMessage, replyMessage } from "@/lib/telegram";

interface Attachment { url: string; name: string; size: number; type: string; }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticketId = parseInt(id);
  const replies = await prisma.ticketReply.findMany({
    where: { ticketId },
    include: { user: { select: { name: true, color: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(replies.map(r => ({
    ...r,
    attachments: JSON.parse(r.attachments ?? "[]") as Attachment[],
  })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticketId = parseInt(id);
  const { body, isInternal, attachments } = await req.json();
  if (!body?.trim() && (!attachments || attachments.length === 0)) {
    return NextResponse.json({ error: "Yanıt veya dosya gerekli" }, { status: 400 });
  }

  const userId = session.type === "customer" ? null : session.id;

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId,
      userId,
      body: body?.trim() ?? "",
      isInternal: !!isInternal,
      attachments: JSON.stringify(attachments ?? []),
    },
    include: { user: { select: { name: true, color: true } } },
  });

  if (session.type !== "customer") {
    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: isInternal ? undefined : "Yanıtlandı" },
    });

    if (!isInternal && ticket.telegramChatId) {
      const senderName = reply.user?.name ?? "Destek Ekibi";
      await sendTelegramMessage(
        ticket.telegramChatId,
        replyMessage(ticket.id, ticket.subject, senderName, body?.trim() ?? "(Dosya eklendi)")
      );
    }
  }

  return NextResponse.json({
    ...reply,
    attachments: JSON.parse(reply.attachments ?? "[]") as Attachment[],
  }, { status: 201 });
}
