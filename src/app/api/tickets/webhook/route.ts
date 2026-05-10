import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { sendTelegramMessage } from "@/lib/telegram";

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

export async function POST(req: NextRequest) {
  try {
    // Webhook secret kontrolü (opsiyonel — WEBHOOK_SECRET set edilmişse zorunlu)
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      const incoming = req.headers.get("x-webhook-secret");
      if (incoming !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const {
      subject, body: emailBody, fromEmail, fromName,
      category: rawCategory, priority: rawPriority, assigneeId,
      source, telegramChatId, telegramMessageId,
    } = body;

    if (!subject || !fromEmail) {
      return NextResponse.json({ error: "subject ve fromEmail zorunludur" }, { status: 400 });
    }

    // Telegram duplicate kontrolü (NaN koruması ile)
    const safeMsgId = telegramMessageId ? Number(telegramMessageId) : null;
    const validMsgId = safeMsgId && !isNaN(safeMsgId) ? safeMsgId : null;
    if (validMsgId) {
      const existing = await prisma.ticket.findUnique({ where: { telegramMessageId: validMsgId } });
      if (existing) {
        return NextResponse.json({ success: true, ticket: existing, duplicate: true }, { status: 200 });
      }
    }

    // AI kategorilendirme (sadece category/priority gönderilmemişse)
    let category = rawCategory;
    let priority = rawPriority;
    if (!category || !priority) {
      const ai = await aiClassify(subject, emailBody ?? "");
      category = category ?? ai.category;
      priority = priority ?? ai.priority;
    }

    // Müşteriyi bul veya oluştur
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
        category,
        status: "Yeni",
        assigneeId: assigneeId ? Number(assigneeId) : null,
        customerId: customer.id,
        priority,
        source: source ?? "web",
        telegramChatId: telegramChatId ? String(telegramChatId) : null,
        telegramMessageId: validMsgId,
      },
      include: { assignee: true, customer: true },
    });

    // Telegram'a "alındı" bildirimi
    if (telegramChatId) {
      await sendTelegramMessage(
        String(telegramChatId),
        `✅ Destek talebiniz alındı!\n\n🎫 Ticket #${ticket.id}\n📌 ${subject}\n🏷️ ${category} · ${priority}\n\nEkibimiz en kısa sürede dönüş yapacak.`
      );
    }

    return NextResponse.json({ success: true, ticket }, { status: 201 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
