import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const type = req.nextUrl.searchParams.get("type") ?? "excel";

  const project = await prisma.project.findUnique({
    where: { id: parseInt(id) },
    include: {
      customer: { select: { name: true, company: true } },
      members: { include: { user: { select: { name: true } } } },
      steps: { include: { tasks: true }, orderBy: { order: "asc" } },
      logs: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  if (type === "excel") {
    const wb = XLSX.utils.book_new();

    // Proje Özeti
    const summary = [
      ["Proje Adı", project.name],
      ["Durum", project.status],
      ["Müşteri", project.customer?.name ?? "-"],
      ["Üyeler", project.members.map(m => m.user.name).join(", ")],
      ["Oluşturulma", new Date(project.createdAt).toLocaleDateString("tr-TR")],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Özet");

    // Adımlar & Görevler
    const tasks: (string | number)[][] = [["Adım", "Adım Durum", "Görev", "Atanan", "Durum", "Tamamlanma"]];
    for (const step of project.steps) {
      for (const task of step.tasks) {
        tasks.push([
          step.name, step.status, task.title,
          task.assigneeId ? `ID:${task.assigneeId}` : "-",
          task.status,
          task.completedAt ? new Date(task.completedAt).toLocaleDateString("tr-TR") : "-",
        ]);
      }
      if (step.tasks.length === 0) tasks.push([step.name, step.status, "-", "-", "-", "-"]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tasks), "Görevler");

    // Log
    const logRows: string[][] = [["Tarih", "Kullanıcı", "İşlem"]];
    for (const log of project.logs) {
      logRows.push([
        new Date(log.createdAt).toLocaleString("tr-TR"),
        log.userName ?? "-",
        log.action,
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logRows), "Log");

    // Sohbet
    const chatRows: string[][] = [["Tarih", "Gönderen", "Tür", "Mesaj"]];
    for (const msg of project.messages) {
      chatRows.push([
        new Date(msg.createdAt).toLocaleString("tr-TR"),
        msg.userName ?? "-",
        msg.userType === "customer" ? "Müşteri" : "Ekip",
        msg.body,
      ]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chatRows), "Sohbet");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="proje-${project.id}.xlsx"`,
      },
    });
  }

  // PDF — basit text tabanlı
  const lines: string[] = [
    `PROJE RAPORU`,
    `Proje: ${project.name}`,
    `Durum: ${project.status}`,
    `Müşteri: ${project.customer?.name ?? "-"}`,
    `Tarih: ${new Date(project.createdAt).toLocaleDateString("tr-TR")}`,
    "",
    "=== ADIMLAR & GÖREVLER ===",
  ];

  for (const step of project.steps) {
    lines.push(`\n[${step.status}] ${step.name}`);
    for (const task of step.tasks) {
      lines.push(`  • ${task.title} — ${task.status}`);
    }
  }

  lines.push("", "=== AKTİVİTE LOGU ===");
  for (const log of project.logs) {
    lines.push(`${new Date(log.createdAt).toLocaleString("tr-TR")} | ${log.userName ?? "-"} | ${log.action}`);
  }

  lines.push("", "=== SOHBET ===");
  for (const msg of project.messages) {
    lines.push(`${new Date(msg.createdAt).toLocaleString("tr-TR")} | ${msg.userName ?? "-"} | ${msg.body}`);
  }

  const text = lines.join("\n");
  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="proje-${project.id}.txt"`,
    },
  });
}
