import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { name, role, color, isAdmin, isActive, password } = await req.json();

  const user = await prisma.user.update({
    where: { id: Number(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(color !== undefined && { color }),
      ...(isAdmin !== undefined && { isAdmin }),
      ...(isActive !== undefined && { isActive }),
      ...(password && { password: await bcrypt.hash(password, 10) }),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...safe } = user;
  return NextResponse.json(safe);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (Number(id) === session.id) return NextResponse.json({ error: "Kendinizi silemezsiniz" }, { status: 400 });

  await prisma.user.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
