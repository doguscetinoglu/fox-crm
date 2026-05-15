import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const messages = await prisma.projectMessage.findMany({
    where: { projectId: parseInt(id) },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { body } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "Mesaj boş olamaz" }, { status: 400 });

  const message = await prisma.projectMessage.create({
    data: {
      projectId: parseInt(id),
      userId: session.type !== "customer" ? session.id : null,
      userName: session.name,
      userType: session.type === "customer" ? "customer" : "user",
      body: body.trim(),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
