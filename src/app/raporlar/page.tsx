"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const PieChart           = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie                = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell               = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip            = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const Legend             = dynamic(() => import("recharts").then(m => m.Legend), { ssr: false });
const BarChart           = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar                = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis              = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis              = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid      = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });

interface ReportData {
  totalTickets: number;
  closedInPeriod: number;
  resolvedPct: number;
  openTickets: number;
  byStatus: { name: string; value: number }[];
  byCategory: { name: string; value: number }[];
  byPriority: { name: string; value: number }[];
  trendData: { label: string; count: number }[];
  hourlyData: { hour: string; count: number }[];
  agentPerf: { name: string; total: number; resolved: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  "Yeni": "#8b5cf6", "İnceleniyor": "#f59e0b", "Yanıtlandı": "#10b981", "Kapalı": "#6b7280",
};
const PRIORITY_COLORS: Record<string, string> = {
  "Düşük": "#94a3b8", "Normal": "#3b82f6", "Yüksek": "#f97316", "Kritik": "#ef4444",
};
const CAT_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#f43f5e"];

const RANGES = [
  { label: "7 Gün",  value: 7 },
  { label: "15 Gün", value: 15 },
  { label: "30 Gün", value: 30 },
  { label: "1 Yıl",  value: 365 },
];

const tooltipStyle = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "12px",
  color: "#f1f5f9",
  fontSize: "12px",
  padding: "8px 12px",
};

function KpiCard({ label, value, sub, color = "indigo" }: { label: string; value: string | number; sub?: string; color?: string }) {
  const gradients: Record<string, string> = {
    indigo: "from-indigo-500 to-violet-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    rose: "from-rose-500 to-red-600",
  };
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm dark:shadow-none relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${gradients[color]}`} />
      <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-gray-100 mt-2">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-200">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      {label && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span>{p.name || "Sayı"}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

export default function RaporlarPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/raporlar?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const Skeleton = () => (
    <div className="h-[220px] bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
  );

  return (
    <div className="p-4 md:p-7 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Raporlar</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">Detaylı performans ve istatistik analizi</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                days === r.value
                  ? "bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-sm"
                  : "text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Toplam Ticket" value={data?.totalTickets ?? "—"} sub="seçili dönemde" color="indigo" />
        <KpiCard label="Çözülen" value={data?.closedInPeriod ?? "—"} sub={`%${data?.resolvedPct ?? 0} çözüm oranı`} color="emerald" />
        <KpiCard label="Açık / Bekleyen" value={data?.openTickets ?? "—"} sub="işlem bekliyor" color="amber" />
        <KpiCard label="Çözüm Oranı" value={`%${data?.resolvedPct ?? 0}`} sub="kapalı / toplam" color="rose" />
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ChartCard title="Durum Dağılımı">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.byStatus ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                  {(data?.byStatus ?? []).map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Kategori Dağılımı">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.byCategory ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                  {(data?.byCategory ?? []).map((_, i) => (
                    <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Öncelik Dağılımı">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data?.byPriority ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                  {(data?.byPriority ?? []).map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? CAT_COLORS[i % CAT_COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Trend Chart */}
      <ChartCard title={`Ticket Trendi — Son ${days} Gün`}>
        {loading ? (
          <div className="h-[260px] bg-slate-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data?.trendData ?? []} barSize={days > 30 ? 20 : 12} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="count" name="Ticket" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Bottom Row: Agent Performance + Hourly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Agent Performansı">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.agentPerf ?? []} layout="vertical" barSize={10} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
                <Bar dataKey="resolved" name="Çözülen" fill="#10b981" radius={[0, 6, 6, 0]} />
                <Bar dataKey="total" name="Toplam" fill="#6366f1" radius={[0, 6, 6, 0]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Saatlik Yoğunluk">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={(data?.hourlyData ?? []).filter((_, i) => i % 2 === 0)} barSize={10} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(245,158,11,0.08)" }} />
                <Bar dataKey="count" name="Ticket" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Agent Table */}
      {(data?.agentPerf?.length ?? 0) > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-200">Agent Özet Tablosu</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
                  {["Agent", "Toplam Ticket", "Çözülen", "Çözüm Oranı", "Performans"].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
                {data?.agentPerf.map((a, i) => {
                  const pct = a.total > 0 ? Math.round((a.resolved / a.total) * 100) : 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-semibold text-slate-800 dark:text-gray-200">{a.name}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-gray-400">{a.total}</td>
                      <td className="px-5 py-3 text-emerald-600 dark:text-emerald-400 font-semibold">{a.resolved}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${pct >= 70 ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" : pct >= 40 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300"}`}>
                          %{pct}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 dark:text-gray-600 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
