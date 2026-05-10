"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface User { id: number; name: string; color: string; }
interface Customer { id: number; name: string | null; company: string | null; }
interface Ticket {
  id: number; subject: string; body: string; fromEmail: string; fromName: string | null;
  category: string; status: string; priority: string; receivedAt: string;
  assignee: User | null; assigneeId: number | null;
  customer: Customer | null; customerId: number | null;
}

const STATUSES = ["Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"];
const CATEGORIES = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];
const PRIORITIES = ["Düşük", "Normal", "Yüksek", "Kritik"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");
  const [catFilter, setCatFilter] = useState("Tümü");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    const [tRes, uRes, cRes] = await Promise.all([
      fetch("/api/tickets").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
    ]);
    setTickets(Array.isArray(tRes) ? tRes : []);
    setUsers(uRes);
    setCustomers(Array.isArray(cRes) ? cRes : []);
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t); }, [fetchAll]);

  const patch = async (id: number, data: object) => {
    setUpdating(id);
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setUpdating(null);
    fetchAll();
  };

  const remove = async (id: number) => {
    if (!confirm("Bu bileti silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.fromEmail.toLowerCase().includes(q) || (t.fromName ?? "").toLowerCase().includes(q) || (t.customer?.name ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "Tümü" || t.status === statusFilter;
    const matchCat = catFilter === "Tümü" || t.category === catFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const EditPanel = ({ t }: { t: Ticket }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
      <div>
        <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Mail İçeriği</p>
        <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{t.body || "(İçerik yok)"}</p>
      </div>
      <div className="space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Durum</label>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map(s => (
              <button key={s} onClick={() => patch(t.id, { status: s })}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${t.status === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Öncelik</label>
          <div className="flex flex-wrap gap-1">
            {PRIORITIES.map(p => (
              <button key={p} onClick={() => patch(t.id, { priority: p })}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${t.priority === p ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Kategori</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => patch(t.id, { category: c })}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${t.category === c ? "bg-violet-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Atanan</label>
          <div className="flex flex-wrap gap-1">
            <button onClick={() => patch(t.id, { assigneeId: null })}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${!t.assigneeId ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
              Atanmadı
            </button>
            {users.map(u => (
              <button key={u.id} onClick={() => patch(t.id, { assigneeId: u.id })}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${t.assigneeId === u.id ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                <UserAvatar name={u.name} color={u.color} size="sm" />
                {u.name.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Müşteri Bağla</label>
          <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
            <button onClick={() => patch(t.id, { customerId: null })}
              className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${!t.customerId ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
              Bağlama
            </button>
            {customers.map(c => (
              <button key={c.id} onClick={() => patch(t.id, { customerId: c.id })}
                className={`text-left px-2.5 py-1.5 text-xs rounded-lg transition-colors ${t.customerId === c.id ? "bg-teal-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                <span className="font-medium">{c.name || "(İsimsiz)"}</span>
                {c.company && <span className="text-gray-500 ml-1">· {c.company}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-7 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">Tüm Biletler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} / {tickets.length} ticket gösteriliyor</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <input
          placeholder="Konu, e-posta, isim veya müşteri ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600"
        />
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
          <div className="flex flex-wrap gap-1">
            {["Tümü", ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {["Tümü", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${catFilter === c ? "bg-violet-700 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl py-16 text-center text-gray-600">Ticket bulunamadı</div>
        )}
        {filtered.map(t => {
          const isExp = expanded === t.id;
          return (
            <div key={t.id}
              className={`bg-gray-900 border rounded-2xl transition-all ${isExp ? "border-indigo-600/40" : "border-gray-800"} ${updating === t.id ? "opacity-50" : ""}`}>
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100 text-sm leading-snug">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{t.fromEmail}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); remove(t.id); }} className="text-gray-700 hover:text-red-400 text-xl leading-none shrink-0">×</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                  {t.assignee ? (
                    <div className="flex items-center gap-1">
                      <UserAvatar name={t.assignee.name} color={t.assignee.color} size="sm" />
                      <span className="text-xs text-gray-400">{t.assignee.name.split(" ")[0]}</span>
                    </div>
                  ) : <span className="text-xs text-red-400/60">Havuzda</span>}
                  <span className="text-xs text-gray-600 ml-auto">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {t.customer && (
                  <div className="mt-2">
                    <Link href={`/musteriler/${t.customer.id}`} onClick={e => e.stopPropagation()}
                      className="text-xs text-indigo-400 hover:text-indigo-300">
                      {t.customer.name || t.customer.company || "Müşteri"} →
                    </Link>
                  </div>
                )}
              </div>
              {isExp && (
                <div className="px-4 pb-4 border-t border-gray-800 bg-gray-950/50 rounded-b-2xl">
                  <EditPanel t={t} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["#", "Konu", "Müşteri", "Kategori", "Öncelik", "Durum", "Atanan", "Tarih", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-16 text-gray-600">Ticket bulunamadı</td></tr>
            )}
            {filtered.map(t => (
              <>
                <tr
                  key={t.id}
                  className={`hover:bg-gray-800/40 transition-colors cursor-pointer ${updating === t.id ? "opacity-50" : ""}`}
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                >
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">#{t.id}</td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-gray-200 font-medium truncate">{t.subject}</p>
                    <p className="text-gray-600 text-xs truncate">{t.fromEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {t.customer ? (
                      <Link href={`/musteriler/${t.customer.id}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors group">
                        <div className="w-6 h-6 rounded-md bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          {(t.customer.name || t.fromEmail)[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-300 group-hover:text-indigo-400 truncate">{t.customer.name || "—"}</p>
                          {t.customer.company && <p className="text-xs text-gray-600 truncate">{t.customer.company}</p>}
                        </div>
                      </Link>
                    ) : (
                      <span className="text-xs text-gray-600 italic">Bağlanmadı</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={t.assignee.name} color={t.assignee.color} size="sm" />
                        <span className="text-xs text-gray-400">{t.assignee.name.split(" ")[0]}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-red-400/60">Havuzda</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); remove(t.id); }} className="text-gray-700 hover:text-red-400 transition-colors text-xl leading-none">×</button>
                  </td>
                </tr>

                {expanded === t.id && (
                  <tr key={`${t.id}-detail`} className="bg-gray-950/50">
                    <td colSpan={9} className="px-5 py-5">
                      <EditPanel t={t} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
