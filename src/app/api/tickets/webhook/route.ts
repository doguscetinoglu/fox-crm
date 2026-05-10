import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, body: emailBody, fromEmail, fromName, category, priority, assigneeId } = body;

    if (!subject || !fromEmail) {
      return NextResponse.json({ error: "subject ve fromEmail zorunludur" }, { status: 400 });
    }

    // Gönderen email'e göre müşteriyi bul ya da otomatik oluştur
    const customer = await prisma.customer.upsert({
      where: { email: fromEmail },
      update: {},
      create: { email: fromEmail, name: fromName ?? null },
    });

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        body: emailBody ?? "",
        fromEmail,
        fromName: fromName ?? null,
        category: category ?? "Genel",
        status: "Yeni",
        assigneeId: assigneeId ? Number(assigneeId) : null,
        customerId: customer.id,
        priority: priority ?? "Normal",
      },
      include: { assignee: true, customer: true },
    });

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
