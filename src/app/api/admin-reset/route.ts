import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const SECRET = "fox-reset-2025-xK9m";

export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hash = await bcrypt.hash("Admin123!", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@sirket.com" },
    update: { password: hash, isAdmin: true, isActive: true },
    create: {
      name: "Admin",
      email: "admin@sirket.com",
      password: hash,
      isAdmin: true,
      role: "Admin",
      color: "orange",
      isActive: true,
    },
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isAdmin: true, isActive: true },
  });

  return NextResponse.json({ ok: true, admin: user.email, users });
}
