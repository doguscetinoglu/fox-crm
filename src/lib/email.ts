import nodemailer from "nodemailer";

interface Attachment { url: string; name: string; size: number; type: string; }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; background:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .wrap { max-width:600px; margin:32px auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08); }
  .header { background:linear-gradient(135deg,#6366f1,#8b5cf6); padding:28px 32px; }
  .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; }
  .header p  { margin:4px 0 0; color:rgba(255,255,255,.7); font-size:13px; }
  .body { padding:28px 32px; color:#334155; font-size:14px; line-height:1.6; }
  .ticket-id { display:inline-block; background:#ede9fe; color:#7c3aed; font-weight:700; font-size:13px; padding:4px 12px; border-radius:20px; margin-bottom:16px; }
  .message-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px 20px; margin:16px 0; white-space:pre-wrap; font-size:13px; color:#475569; }
  .attachments { margin-top:12px; }
  .att-link { display:inline-flex; align-items:center; gap:6px; background:#f1f5f9; border:1px solid #e2e8f0; border-radius:8px; padding:6px 12px; margin:4px 4px 0 0; font-size:12px; color:#4f46e5; text-decoration:none; }
  .footer { padding:20px 32px; border-top:1px solid #f1f5f9; font-size:12px; color:#94a3b8; text-align:center; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>Destek Merkezi</h1>
    <p>Müşteri Destek Sistemi</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">Bu mail otomatik olarak oluşturulmuştur. Lütfen yanıtlamayın — yanıtlamak için bu maile reply yapabilirsiniz.</div>
</div>
</body>
</html>`;
}

export async function sendTicketConfirmationEmail(
  to: string,
  ticketId: number,
  subject: string,
): Promise<void> {
  const emailSubject = `[Ticket #${ticketId}] ${subject}`;
  const html = baseTemplate(`
    <p>Merhaba,</p>
    <p>Destek talebiniz başarıyla alındı.</p>
    <span class="ticket-id">Ticket #${ticketId}</span>
    <p><strong>Konu:</strong> ${subject}</p>
    <p>Ekibimiz talebinizi inceleyecek ve en kısa sürede dönüş yapacaktır.</p>
    <p>Bu maile doğrudan yanıt vererek iletişimi sürdürebilirsiniz.</p>
  `);

  await transporter.sendMail({
    from: `"Destek Merkezi" <${process.env.EMAIL_FROM}>`,
    to,
    subject: emailSubject,
    html,
    text: `Destek talebiniz alındı.\n\nTicket #${ticketId}\nKonu: ${subject}\n\nEkibimiz en kısa sürede dönüş yapacaktır.`,
  });
}

export async function sendReplyEmail(
  to: string,
  ticketId: number,
  subject: string,
  agentName: string,
  body: string,
  attachments: Attachment[] = [],
): Promise<void> {
  const emailSubject = `Re: [Ticket #${ticketId}] ${subject}`;

  const attHtml = attachments.length > 0
    ? `<div class="attachments">
        <p style="font-size:12px;color:#64748b;margin:8px 0 4px;">Ekler:</p>
        ${attachments.map(a => `<a class="att-link" href="${a.url}" target="_blank">📎 ${a.name}</a>`).join("")}
       </div>`
    : "";

  const html = baseTemplate(`
    <p>Merhaba,</p>
    <p><strong>${agentName}</strong> destek talebinize yanıt verdi:</p>
    <span class="ticket-id">Ticket #${ticketId}</span>
    <div class="message-box">${body.replace(/\n/g, "<br>")}</div>
    ${attHtml}
    <p style="margin-top:20px;font-size:13px;color:#64748b;">Bu maile yanıt vererek konuşmaya devam edebilirsiniz.</p>
  `);

  const attText = attachments.length > 0
    ? `\n\nEkler:\n${attachments.map(a => `- ${a.name}: ${a.url}`).join("\n")}`
    : "";

  await transporter.sendMail({
    from: `"Destek Merkezi" <${process.env.EMAIL_FROM}>`,
    to,
    subject: emailSubject,
    html,
    text: `${agentName} destek talebinize yanıt verdi:\n\n${body}${attText}`,
  });
}
