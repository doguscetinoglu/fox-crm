import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let where: any = {};
  if (session.type === "agent") {
    where = { OR: [{ assigneeId: session.id }, { assigneeId: null }] };
  } else if (session.type === "customer") {
    where = { customerId: session.id };
  }

  const tickets = await prisma.ticket.findMany({
    where,
    include: {
      assignee: true,
      customer: { select: { id: true, name: true, company: true } },
    },
    orderBy: { receivedAt: "desc" },
  });
  return NextResponse.json(tickets);
}
