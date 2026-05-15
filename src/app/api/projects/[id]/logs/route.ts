import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const logs = await prisma.projectLog.findMany({
    where: { projectId: parseInt(id) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(logs);
}
