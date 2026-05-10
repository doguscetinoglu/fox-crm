import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  return NextResponse.json(replies);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticketId = parseInt(id);
  const { body, isInternal } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Yanıt boş olamaz" }, { status: 400 });

  const userId = session.type === "customer" ? null : session.id;

  const reply = await prisma.ticketReply.create({
    data: { ticketId, userId, body: body.trim(), isInternal: !!isInternal },
    include: { user: { select: { name: true, color: true } } },
  });

  if (session.type !== "customer") {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: isInternal ? undefined : "Yanıtlandı" },
    });
  }

  return NextResponse.json(reply, { status: 201 });
}
