import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

interface Attachment { url: string; name: string; size: number; type: string; }

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; replyId: string }> }
) {
  const session = await getSession();
  if (!session || session.type === "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, replyId } = await params;
  const { attachments } = await req.json() as { attachments: Attachment[] };

  const reply = await prisma.ticketReply.update({
    where: { id: parseInt(replyId), ticketId: parseInt(id) },
    data: { attachments: JSON.stringify(attachments ?? []) },
  });

  return NextResponse.json({
    ...reply,
    attachments: JSON.parse(reply.attachments ?? "[]") as Attachment[],
  });
}
