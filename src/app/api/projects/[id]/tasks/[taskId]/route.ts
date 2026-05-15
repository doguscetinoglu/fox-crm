import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function syncStepStatus(stepId: number, projectId: number, session: { id: number; name: string }) {
  const tasks = await prisma.projectTask.findMany({ where: { stepId } });
  if (tasks.length === 0) return;
  const allDone = tasks.every(t => t.status === "Tamamlandı");
  const anyInProgress = tasks.some(t => t.status === "Devam Ediyor");
  const newStatus = allDone ? "Tamamlandı" : anyInProgress ? "Devam Ediyor" : "Beklemede";

  await prisma.projectStep.update({ where: { id: stepId }, data: { status: newStatus } });

  // Proje durumunu da senkronize et
  const allSteps = await prisma.projectStep.findMany({ where: { projectId } });
  const projDone = allSteps.every(s => s.status === "Tamamlandı");
  await prisma.project.update({
    where: { id: projectId },
    data: { status: projDone ? "Tamamlandı" : "Devam Ediyor" },
  });

  if (allDone) {
    const step = await prisma.projectStep.findUnique({ where: { id: stepId } });
    await prisma.projectLog.create({
      data: { projectId, userId: session.id, userName: session.name, action: `Adım tamamlandı: ${step?.name}` },
    });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, taskId } = await params;
  const projectId = parseInt(id);
  const body = await req.json();

  const task = await prisma.projectTask.update({
    where: { id: parseInt(taskId) },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && {
        status: body.status,
        completedAt: body.status === "Tamamlandı" ? new Date() : null,
      }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId }),
      ...(body.assigneeType !== undefined && { assigneeType: body.assigneeType }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.description !== undefined && { description: body.description }),
    },
  });

  if (body.status) {
    await prisma.projectLog.create({
      data: { projectId, userId: session.id, userName: session.name, action: `Görev "${task.title}": ${body.status}` },
    });
    await syncStepStatus(task.stepId, projectId, session as { id: number; name: string });
  }

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, taskId } = await params;

  const task = await prisma.projectTask.delete({ where: { id: parseInt(taskId) } });
  await prisma.projectLog.create({
    data: { projectId: parseInt(id), userId: session.id, userName: session.name, action: `Görev silindi: ${task.title}` },
  });

  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  // taskId burada stepId gibi kullanılır — /steps/[stepId]/tasks endpoint'i yerine flat yapı
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, taskId } = await params;
  const { title, description, assigneeId, assigneeType, dueDate } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Görev başlığı zorunlu" }, { status: 400 });

  const task = await prisma.projectTask.create({
    data: {
      stepId: parseInt(taskId),
      title: title.trim(),
      description: description ?? null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      assigneeType: assigneeType ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  await prisma.projectLog.create({
    data: { projectId: parseInt(id), userId: session.id, userName: session.name, action: `Görev oluşturuldu: ${title.trim()}` },
  });

  return NextResponse.json(task, { status: 201 });
}
