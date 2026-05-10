import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    allTickets,
    byStatus,
    byCategory,
    byPriority,
    users,
    totalTickets,
    closedInPeriod,
  ] = await Promise.all([
    prisma.ticket.findMany({
      where: { receivedAt: { gte: since } },
      select: { receivedAt: true, status: true },
    }),
    prisma.ticket.groupBy({
      by: ["status"],
      where: { receivedAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["category"],
      where: { receivedAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.ticket.groupBy({
      by: ["priority"],
      where: { receivedAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.user.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { tickets: true } },
        tickets: {
          where: {
            receivedAt: { gte: since },
            status: "Kapalı",
          },
          select: { id: true },
        },
      },
    }),
    prisma.ticket.count({ where: { receivedAt: { gte: since } } }),
    prisma.ticket.count({ where: { receivedAt: { gte: since }, status: "Kapalı" } }),
  ]);

  // Daily trend
  const trendMap: Record<string, number> = {};
  const totalDays = Math.min(days, 60);
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    trendMap[key] = 0;
  }
  for (const t of allTickets) {
    const key = new Date(t.receivedAt).toISOString().split("T")[0];
    if (key in trendMap) trendMap[key]++;
  }

  // If yearly, group by month
  let trendData;
  if (days >= 180) {
    const monthMap: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthMap[key] = 0;
    }
    for (const t of allTickets) {
      const d = new Date(t.receivedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthMap) monthMap[key]++;
    }
    trendData = Object.entries(monthMap).map(([label, count]) => ({
      label: label.slice(5) + "/" + label.slice(2, 4),
      count,
    }));
  } else {
    const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    trendData = Object.entries(trendMap).map(([date, count]) => {
      const d = new Date(date);
      return {
        label: `${DAYS_TR[d.getUTCDay()]} ${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
        count,
      };
    });
    if (days > 15) {
      trendData = trendData.filter((_, i) => i % 2 === 0 || i === trendData.length - 1);
    }
  }

  // Hourly distribution
  const hourlyMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
  for (const t of allTickets) hourlyMap[new Date(t.receivedAt).getUTCHours()]++;
  const hourlyData = Object.entries(hourlyMap).map(([h, count]) => ({
    hour: `${h.toString().padStart(2, "0")}:00`,
    count,
  }));

  // Agent performance
  const agentPerf = users
    .map(u => ({
      name: u.name.split(" ")[0],
      total: u._count.tickets,
      resolved: u.tickets.length,
    }))
    .sort((a, b) => b.resolved - a.resolved)
    .slice(0, 8);

  const resolvedPct = totalTickets > 0 ? Math.round((closedInPeriod / totalTickets) * 100) : 0;

  return NextResponse.json({
    totalTickets,
    closedInPeriod,
    resolvedPct,
    openTickets: (byStatus.find(s => s.status === "Yeni")?._count.id ?? 0) + (byStatus.find(s => s.status === "İnceleniyor")?._count.id ?? 0),
    byStatus: byStatus.map(s => ({ name: s.status, value: s._count.id })),
    byCategory: byCategory.map(c => ({ name: c.category, value: c._count.id })),
    byPriority: byPriority.map(p => ({ name: p.priority, value: p._count.id })),
    trendData,
    hourlyData,
    agentPerf,
  });
}
