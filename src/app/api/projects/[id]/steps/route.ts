import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const projectId = parseInt(id);
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Adım adı zorunlu" }, { status: 400 });

  const count = await prisma.projectStep.count({ where: { projectId } });
  const step = await prisma.projectStep.create({
    data: { projectId, name: name.trim(), order: count },
    include: { tasks: true },
  });

  await prisma.projectLog.create({
    data: { projectId, userId: session.id, userName: session.name, action: `Adım eklendi: ${name.trim()}` },
  });

  return NextResponse.json(step, { status: 201 });
}
