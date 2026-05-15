import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { sendTicketConfirmationEmail } from "@/lib/email";

const CATEGORIES = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];
const PRIORITIES = ["Normal", "Yüksek", "Kritik"];

async function aiClassify(subject: string, body: string): Promise<{ category: string; priority: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { category: "Genel", priority: "Normal" };
  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 80,
      messages: [{
        role: "user",
        content: `Aşağıdaki destek talebini analiz et ve yalnızca JSON formatında yanıt ver.
Kategori (birini seç): Genel, Teknik Destek, Fatura, Öneri, Şikayet
Öncelik (birini seç): Normal, Yüksek, Kritik

Konu: ${subject}
Mesaj: ${body.substring(0, 500)}

{"category":"...","priority":"..."}`,
      }],
    });
    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (!jsonMatch) return { category: "Genel", priority: "Normal" };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "Genel",
      priority: PRIORITIES.includes(parsed.priority) ? parsed.priority : "Normal",
    };
  } catch {
    return { category: "Genel", priority: "Normal" };
  }
}

// Ticket ID'yi email konusundan çıkar: "[#42]", "#42", "[Ticket #42]" gibi pattern'lar
function extractTicketId(subject: string): number | null {
  const match = subject.match(/#(\d+)/);
  return match ? parseInt(match[1]) : null;
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const incoming = req.headers.get("x-webhook-secret");
      if (incoming !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { messageId, from, fromName, subject, body, inReplyTo } = await req.json();

    if (!from || !subject) {
      return NextResponse.json({ error: "from ve subject zorunludur" }, { status: 400 });
    }

    // Duplicate kontrolü
    if (messageId) {
      const existing = await prisma.ticket.findFirst({
        where: { emailMessageId: messageId },
      });
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true, ticket: existing });
      }
    }

    // Ticket ID var mı kontrol et (yanıt mı, yeni ticket mi?)
    const subjectTicketId = extractTicketId(subject ?? "");
    const replyToTicketId = inReplyTo ? extractTicketId(inReplyTo) : null;
    const linkedTicketId = subjectTicketId ?? replyToTicketId;

    if (linkedTicketId) {
      // Mevcut ticket'a yanıt olarak ekle
      const ticket = await prisma.ticket.findUnique({ where: { id: linkedTicketId } });
      if (ticket) {
        const reply = await prisma.ticketReply.create({
          data: {
            ticketId: ticket.id,
            userId: null,
            body: body ?? "",
            isInternal: false,
            attachments: "[]",
          },
        });
        return NextResponse.json({ success: true, reply }, { status: 201 });
      }
    }

    // Yeni ticket oluştur
    const { category, priority } = await aiClassify(subject, body ?? "");

    const ticket = await prisma.ticket.create({
      data: {
        subject,
        body: body ?? "",
        fromEmail: from,
        fromName: fromName ?? null,
        category,
        priority,
        status: "Yeni",
        source: "email",
        emailMessageId: messageId ?? null,
      },
    });

    // Alındı bildirimi gönder
    try {
      await sendTicketConfirmationEmail(from, ticket.id, subject);
    } catch (e) {
      console.error("Confirmation email gönderilemedi:", e);
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    console.error("Email inbound error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
