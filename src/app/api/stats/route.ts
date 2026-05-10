import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfWeek = new Date(startOfToday); startOfWeek.setUTCDate(startOfWeek.getUTCDate() - 7);
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      total, open, inProgress, answered, closed,
      todayCount, weekCount, monthCount, unassigned,
      byCategory, byPriority,
      users,
      recent,
      allTickets,
      customerCount,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "Yeni" } }),
      prisma.ticket.count({ where: { status: "İnceleniyor" } }),
      prisma.ticket.count({ where: { status: "Yanıtlandı" } }),
      prisma.ticket.count({ where: { status: "Kapalı" } }),
      prisma.ticket.count({ where: { receivedAt: { gte: startOfToday } } }),
      prisma.ticket.count({ where: { receivedAt: { gte: startOfWeek } } }),
      prisma.ticket.count({ where: { receivedAt: { gte: startOfMonth } } }),
      prisma.ticket.count({ where: { assigneeId: null } }),
      prisma.ticket.groupBy({ by: ["category"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      prisma.ticket.groupBy({ by: ["priority"], _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
      prisma.user.findMany({
        include: {
          _count: { select: { tickets: true } },
          tickets: { where: { status: { notIn: ["Kapalı", "Yanıtlandı"] } }, select: { id: true } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.ticket.findMany({
        take: 8,
        orderBy: { receivedAt: "desc" },
        include: { assignee: { select: { name: true, color: true } }, customer: { select: { id: true, name: true, company: true } } },
      }),
      prisma.ticket.findMany({
        where: { receivedAt: { gte: sixMonthsAgo } },
        select: { receivedAt: true },
      }),
      prisma.customer.count(),
    ]);

    // Son 7 gün günlük (UTC)
    const dailyMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setUTCDate(d.getUTCDate() - i);
      dailyMap[d.toISOString().split("T")[0]] = 0;
    }

    // Aylık trend (son 6 ay)
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
    }

    // Saatlik dağılım (son 7 gün, tüm gün)
    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;

    // Haftanın günleri (son 30 gün)
    const weekdayMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    for (const t of allTickets) {
      const d = new Date(t.receivedAt);
      const dayKey = d.toISOString().split("T")[0];
      if (dayKey in dailyMap) dailyMap[dayKey]++;

      const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (monthKey in monthlyMap) monthlyMap[monthKey]++;

      const hour = d.getUTCHours();
      hourlyMap[hour]++;

      const dayOfWeek = d.getUTCDay();
      weekdayMap[dayOfWeek]++;
    }

    const dailyData = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));
    const monthlyData = Object.entries(monthlyMap).map(([month, count]) => ({ month, count }));
    const hourlyData = Object.entries(hourlyMap).map(([hour, count]) => ({ hour: Number(hour), count }));
    const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
    const weekdayData = Object.entries(weekdayMap).map(([day, count]) => ({ day: DAYS_TR[Number(day)], count }));

    // Müşteri istatistikleri
    const customerMap: Record<string, { email: string; name: string | null; count: number }> = {};
    for (const t of allTickets) {
      if (!customerMap[t.receivedAt.toString()]) {
        // just use allTickets for customer grouping via a fresh query
      }
    }
    const topCustomers = await prisma.customer.findMany({
      include: { _count: { select: { tickets: true } } },
      orderBy: { tickets: { _count: "desc" } },
      take: 5,
    });

    return NextResponse.json({
      total, open, inProgress, answered, closed,
      todayCount, weekCount, monthCount, unassigned,
      customerCount,
      byCategory, byPriority,
      users: users.map(u => ({ ...u, openTickets: u.tickets.length })),
      recent,
      dailyData,
      monthlyData,
      hourlyData,
      weekdayData,
      topCustomers,
    });
  } catch (err) {
    console.error("Stats error:", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
