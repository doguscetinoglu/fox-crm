import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.type === "customer") {
    const projects = await prisma.project.findMany({
      where: { customerId: session.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, color: true } } } },
        steps: { include: { tasks: true }, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  }

  const projects = await prisma.project.findMany({
    include: {
      customer: { select: { id: true, name: true, company: true } },
      members: { include: { user: { select: { id: true, name: true, color: true } } } },
      steps: { include: { tasks: true }, orderBy: { order: "asc" } },
      _count: { select: { messages: true, logs: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, customerId, memberIds, steps } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Proje adı zorunlu" }, { status: 400 });

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      description: description ?? null,
      customerId: customerId ? Number(customerId) : null,
      members: memberIds?.length
        ? { create: memberIds.map((uid: number) => ({ userId: uid })) }
        : undefined,
      steps: steps?.length
        ? { create: steps.map((s: { name: string }, i: number) => ({ name: s.name, order: i })) }
        : undefined,
      logs: {
        create: { userId: session.id, userName: session.name, action: "Proje oluşturuldu" },
      },
    },
    include: {
      customer: { select: { id: true, name: true, company: true } },
      members: { include: { user: { select: { id: true, name: true, color: true } } } },
      steps: { include: { tasks: true }, orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
