import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: { select: { id: true, name: true, company: true, email: true } },
      members: { include: { user: { select: { id: true, name: true, color: true, role: true } } } },
      steps: {
        include: { tasks: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const data = await req.json();

  const project = await prisma.project.update({
    where: { id: parseInt(id) },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.customerId !== undefined && { customerId: data.customerId ? Number(data.customerId) : null }),
    },
  });

  if (data.status) {
    await prisma.projectLog.create({
      data: { projectId: project.id, userId: session.id, userName: session.name, action: `Proje durumu: ${data.status}` },
    });
  }

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.project.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
