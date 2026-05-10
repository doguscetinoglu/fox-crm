"use client";

import { useCallback, useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import UserAvatar from "@/components/UserAvatar";
import MiniBar from "@/components/MiniBar";
import DailyChart from "@/components/DailyChart";
import MonthlyChart from "@/components/MonthlyChart";
import HourlyChart from "@/components/HourlyChart";
import WeekdayChart from "@/components/WeekdayChart";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import Link from "next/link";

interface Stats {
  total: number; open: number; inProgress: number; answered: number; closed: number;
  todayCount: number; weekCount: number; monthCount: number; unassigned: number;
  customerCount: number;
  byCategory: { category: string; _count: { id: number } }[];
  byPriority: { priority: string; _count: { id: number } }[];
  users: { id: number; name: string; color: string; role: string; _count: { tickets: number }; openTickets: number }[];
  recent: {
    id: number; subject: string; fromName: string | null; fromEmail: string;
    status: string; priority: string; receivedAt: string;
    assignee: { name: string; color: string } | null;
    customer: { id: number; name: string | null; company: string | null } | null;
  }[];
  dailyData: { date: string; count: number }[];
  monthlyData: { month: string; count: number }[];
  hourlyData: { hour: number; count: number }[];
  weekdayData: { day: string; count: number }[];
  topCustomers: { id: number; email: string; name: string | null; company: string | null; _count: { tickets: number } }[];
}

function Ring({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2937" strokeWidth={8} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<"daily" | "monthly">("daily");

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/stats").then(r => r.json());
    setStats(res);
  }, []);

  useEffect(() => { fetchStats(); const t = setInterval(fetchStats, 20000); return () => clearInterval(t); }, [fetchStats]);

  const s = stats;
  const resolvedPct = s && s.total > 0 ? Math.round(((s.answered + s.closed) / s.total) * 100) : 0;
  const openPct = s && s.total > 0 ? Math.round(((s.open + s.inProgress) / s.total) * 100) : 0;
  const unassignedPct = s && s.total > 0 ? Math.round((s.unassigned / s.total) * 100) : 0;

  return (
    <div className="p-7 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Genel bakış ve detaylı istatistikler</p>
        </div>
        <span className="text-xs text-gray-600">
          {new Date().toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard label="Toplam Ticket" value={s?.total ?? "—"} sub="tüm zamanlar" icon="📧" accent="bg-indigo-500/20" />
        <StatCard label="Bugün Gelen" value={s?.todayCount ?? "—"} sub={`Bu hafta: ${s?.weekCount ?? "—"}`} icon="📬" accent="bg-blue-500/20" />
        <StatCard label="Bu Ay" value={s?.monthCount ?? "—"} sub="gelen toplam" icon="📅" accent="bg-violet-500/20" />
        <StatCard label="Toplam Müşteri" value={s?.customerCount ?? "—"} sub="kayıtlı" icon="👤" accent="bg-teal-500/20" />
        <StatCard label="Havuz (Atanmamış)" value={s?.unassigned ?? "—"} sub="bekliyor" icon="📥" accent="bg-red-500/20" />
      </div>

      {/* KPI row 2 — durum kartları */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Yeni" value={s?.open ?? "—"} icon="🔵" accent="bg-violet-500/10" />
        <StatCard label="İnceleniyor" value={s?.inProgress ?? "—"} icon="🟡" accent="bg-amber-500/10" />
        <StatCard label="Yanıtlandı" value={s?.answered ?? "—"} icon="🟢" accent="bg-emerald-500/10" />
        <StatCard label="Kapalı" value={s?.closed ?? "—"} icon="⚫" accent="bg-gray-700/30" />
      </div>

      {/* Özet ring + grafik satırı */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        {/* Ring metrikler */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-5">
          <h2 className="text-sm font-semibold text-gray-200">Özet Oranlar</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring pct={resolvedPct} color="#10b981" />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-emerald-400">%{resolvedPct}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Çözüm Oranı</p>
              <p className="text-xs text-gray-500">Yanıtlandı + Kapalı</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring pct={openPct} color="#f59e0b" />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-amber-400">%{openPct}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Açık Oran</p>
              <p className="text-xs text-gray-500">Yeni + İnceleniyor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Ring pct={unassignedPct} color="#ef4444" />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-red-400">%{unassignedPct}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-200">Atanmamış</p>
              <p className="text-xs text-gray-500">Havuzdaki oran</p>
            </div>
          </div>
        </div>

        {/* Trend grafik — günlük/aylık tab */}
        <div className="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Ticket Trendi</h2>
            <div className="flex gap-1">
              <button onClick={() => setTab("daily")} className={`px-3 py-1 text-xs rounded-lg transition-colors ${tab === "daily" ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>7 Gün</button>
              <button onClick={() => setTab("monthly")} className={`px-3 py-1 text-xs rounded-lg transition-colors ${tab === "monthly" ? "bg-violet-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>6 Ay</button>
            </div>
          </div>
          {tab === "daily"
            ? s?.dailyData ? <DailyChart data={s.dailyData} /> : <div className="h-20 flex items-center justify-center text-gray-600 text-sm">Yükleniyor...</div>
            : s?.monthlyData ? <MonthlyChart data={s.monthlyData} /> : <div className="h-24 flex items-center justify-center text-gray-600 text-sm">Yükleniyor...</div>
          }
          {tab === "daily" && (
            <p className="text-xs text-gray-600 mt-4">Son 7 günün günlük ticket dağılımı</p>
          )}
          {tab === "monthly" && (
            <p className="text-xs text-gray-600 mt-4">Son 6 aylık toplam ticket hacmi</p>
          )}
        </div>
      </div>

      {/* Saatlik + Haftanın Günleri */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-200">Saatlik Dağılım</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500" /> Çalışma saati</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-700" /> Gece</span>
            </div>
          </div>
          {s?.hourlyData ? <HourlyChart data={s.hourlyData} /> : <div className="h-16 flex items-center justify-center text-gray-600 text-sm">Yükleniyor...</div>}
          <p className="text-xs text-gray-600 mt-6">Saat başına gelen ticket dağılımı (09:00–18:00 iş saatleri)</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-200">Haftanın Günleri</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-600" /> İş günü</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-600" /> Haftasonu</span>
            </div>
          </div>
          {s?.weekdayData ? <WeekdayChart data={s.weekdayData} /> : <div className="h-16 flex items-center justify-center text-gray-600 text-sm">Yükleniyor...</div>}
          <p className="text-xs text-gray-600 mt-3">Hangi gün daha fazla ticket geliyor?</p>
        </div>
      </div>

      {/* Orta satır */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Durum breakdown */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Durum Dağılımı</h2>
          {s ? (
            <div className="space-y-3">
              {[
                { label: "Yeni", val: s.open, color: "bg-violet-500" },
                { label: "İnceleniyor", val: s.inProgress, color: "bg-amber-500" },
                { label: "Yanıtlandı", val: s.answered, color: "bg-emerald-500" },
                { label: "Kapalı", val: s.closed, color: "bg-gray-600" },
              ].map(({ label, val, color }) => {
                const pct = s.total > 0 ? Math.round((val / s.total) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-gray-300 font-semibold">{val} <span className="text-gray-600 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <div className="text-gray-600 text-sm">Yükleniyor...</div>}
        </div>

        {/* Kategori + Öncelik */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-3">Kategoriye Göre</h2>
            <MiniBar data={(s?.byCategory ?? []).map(c => ({ label: c.category, count: c._count.id }))} color="bg-indigo-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-200 mb-3">Önceliğe Göre</h2>
            <MiniBar data={(s?.byPriority ?? []).map(p => ({ label: p.priority, count: p._count.id }))} color="bg-orange-500" />
          </div>
        </div>

        {/* Ekip yükü */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-gray-200 mb-4">Ekip Yükü</h2>
          <div className="space-y-3">
            {(s?.users ?? []).map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <UserAvatar name={u.name} color={u.color} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-300 font-medium truncate">{u.name.split(" ")[0]}</span>
                    <span className="text-gray-500">{u._count.tickets}</span>
                  </div>
                  <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${s && s.total > 0 ? (u._count.tickets / Math.max(...(s.users.map(x => x._count.tickets)), 1)) * 100 : 0}%` }} />
                  </div>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded ${u.openTickets > 0 ? "bg-orange-500/20 text-orange-300" : "bg-gray-800 text-gray-600"}`}>
                  {u.openTickets} açık
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* En aktif müşteriler */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-200">En Aktif Müşteriler</h2>
          <Link href="/musteriler" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Tümünü gör →</Link>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-3">
          {(s?.topCustomers ?? []).map((c, i) => (
            <Link key={c.id} href={`/musteriler/${c.id}`}
              className="bg-gray-800/60 hover:bg-gray-800 border border-gray-700/60 hover:border-gray-600 rounded-xl p-4 transition-all block">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                  {(c.name || c.email)[0].toUpperCase()}
                </div>
                <span className="text-xs text-gray-500">#{i + 1}</span>
              </div>
              <p className="text-sm font-semibold text-gray-200 truncate">{c.name || c.email}</p>
              {c.company && <p className="text-xs text-gray-500 truncate">{c.company}</p>}
              <p className="text-xs text-gray-600 mt-1">{c.email}</p>
              <div className="mt-2 flex items-center gap-1">
                <span className="text-xl font-bold text-indigo-400">{c._count.tickets}</span>
                <span className="text-xs text-gray-600">ticket</span>
              </div>
            </Link>
          ))}
          {(!s?.topCustomers || s.topCustomers.length === 0) && (
            <p className="text-xs text-gray-600 col-span-5 text-center py-4">Henüz müşteri yok</p>
          )}
        </div>
      </div>

      {/* Son biletler */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-200">Son Gelen Biletler</h2>
          <Link href="/tickets" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Tümünü gör →</Link>
        </div>
        {!s?.recent || s.recent.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-6">Henüz ticket yok</p>
        ) : (
          <div className="space-y-0.5">
            {s.recent.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 transition-colors">
                <span className="text-xs text-gray-600 font-mono w-8 shrink-0">#{t.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{t.subject}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {t.customer?.name || t.fromName || t.fromEmail}
                    {t.customer?.company && <span className="text-gray-600"> · {t.customer.company}</span>}
                  </p>
                </div>
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
                {t.assignee ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <UserAvatar name={t.assignee.name} color={t.assignee.color} size="sm" />
                    <span className="text-xs text-gray-500 hidden xl:block">{t.assignee.name.split(" ")[0]}</span>
                  </div>
                ) : (
                  <span className="text-xs text-red-400/70 shrink-0 w-16 text-right">Havuzda</span>
                )}
                <span className="text-xs text-gray-600 shrink-0 w-24 text-right">
                  {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
