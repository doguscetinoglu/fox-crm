import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function syncProjectStatus(projectId: number) {
  const steps = await prisma.projectStep.findMany({ where: { projectId } });
  const allDone = steps.length > 0 && steps.every(s => s.status === "Tamamlandı");
  const anyInProgress = steps.some(s => s.status === "Devam Ediyor");
  const newStatus = allDone ? "Tamamlandı" : anyInProgress ? "Devam Ediyor" : "Beklemede";
  await prisma.project.update({ where: { id: projectId }, data: { status: newStatus } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, stepId } = await params;
  const { name, status } = await req.json();

  const step = await prisma.projectStep.update({
    where: { id: parseInt(stepId) },
    data: {
      ...(name !== undefined && { name }),
      ...(status !== undefined && { status }),
    },
    include: { tasks: true },
  });

  if (status) {
    await syncProjectStatus(parseInt(id));
    await prisma.projectLog.create({
      data: { projectId: parseInt(id), userId: session.id, userName: session.name, action: `Adım "${step.name}": ${status}` },
    });
  }

  return NextResponse.json(step);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, stepId } = await params;

  const step = await prisma.projectStep.delete({ where: { id: parseInt(stepId) } });
  await prisma.projectLog.create({
    data: { projectId: parseInt(id), userId: session.id, userName: session.name, action: `Adım silindi: ${step.name}` },
  });

  return NextResponse.json({ success: true });
}
