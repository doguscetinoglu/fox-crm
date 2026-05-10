"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";

interface User { id: number; name: string; color: string; }
interface Customer { id: number; name: string | null; company: string | null; }
interface Reply { id: number; body: string; isInternal: boolean; createdAt: string; user: { name: string; color: string } | null; }
interface Ticket {
  id: number; subject: string; body: string; fromEmail: string; fromName: string | null;
  category: string; status: string; priority: string; receivedAt: string;
  assignee: User | null; assigneeId: number | null;
  customer: Customer | null; customerId: number | null;
}

const STATUSES    = ["Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"];
const CATEGORIES  = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];
const PRIORITIES  = ["Düşük", "Normal", "Yüksek", "Kritik"];

const Btn = ({ active, color = "indigo", onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) => {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-600 text-white",
    orange: "bg-orange-500 text-white",
    violet: "bg-violet-600 text-white",
    teal:   "bg-teal-600 text-white",
    gray:   "bg-slate-600 text-white",
  };
  return (
    <button onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-lg transition-all ${active ? colors[color] : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"}`}>
      {children}
    </button>
  );
};

function ReplyPanel({ ticketId, onStatusChange }: { ticketId: number; onStatusChange: () => void }) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchReplies = useCallback(async () => {
    const res = await fetch(`/api/tickets/${ticketId}/replies`);
    if (res.ok) setReplies(await res.json());
  }, [ticketId]);

  useEffect(() => { fetchReplies(); }, [fetchReplies]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies]);

  const send = async () => {
    if (!body.trim()) return;
    setSending(true);
    await fetch(`/api/tickets/${ticketId}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, isInternal }),
    });
    setSending(false);
    setBody("");
    fetchReplies();
    if (!isInternal) onStatusChange();
  };

  return (
    <div className="border-t border-slate-100 dark:border-gray-800 mt-4 pt-4">
      <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-3">Yanıtlar ({replies.length})</p>

      {replies.length > 0 && (
        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto pr-1">
          {replies.map(r => (
            <div key={r.id} className={`flex gap-3 p-3 rounded-xl text-sm ${r.isInternal ? "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20" : "bg-slate-50 dark:bg-gray-800/60 border border-slate-100 dark:border-gray-700/50"}`}>
              <div className="shrink-0 mt-0.5">
                {r.user ? (
                  <UserAvatar name={r.user.name} color={r.user.color} size="sm" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">M</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-700 dark:text-gray-300 text-xs">{r.user?.name ?? "Müşteri"}</span>
                  {r.isInternal && <span className="text-[10px] bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-medium">İç Not</span>}
                  <span className="text-[11px] text-slate-400 dark:text-gray-600 ml-auto">
                    {new Date(r.createdAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed">{r.body}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isInternal ? "İç not ekle (müşteri görmez)..." : "Müşteriye yanıt yaz..."}
          rows={3}
          className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) send(); }}
        />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-gray-500 select-none">
            <div
              onClick={() => setIsInternal(!isInternal)}
              className={`w-8 h-4 rounded-full transition-colors relative cursor-pointer ${isInternal ? "bg-amber-500" : "bg-slate-200 dark:bg-gray-700"}`}
            >
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${isInternal ? "left-4" : "left-0.5"}`} />
            </div>
            İç Not
          </label>
          <button
            onClick={send}
            disabled={sending || !body.trim()}
            className={`ml-auto px-4 py-1.5 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 ${isInternal ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20"}`}
          >
            {sending ? "Gönderiliyor..." : isInternal ? "İç Not Ekle" : "Yanıtla"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditPanel({ t, users, customers, patch }: { t: Ticket; users: User[]; customers: Customer[]; patch: (id: number, data: object) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
      <div>
        <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">İçerik</p>
        <p className="text-sm text-slate-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{t.body || "(İçerik yok)"}</p>
      </div>

      <div className="space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Durum</label>
          <div className="flex flex-wrap gap-1">
            {STATUSES.map(s => <Btn key={s} active={t.status === s} color="indigo" onClick={() => patch(t.id, { status: s })}>{s}</Btn>)}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Öncelik</label>
          <div className="flex flex-wrap gap-1">
            {PRIORITIES.map(p => <Btn key={p} active={t.priority === p} color="orange" onClick={() => patch(t.id, { priority: p })}>{p}</Btn>)}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Kategori</label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map(c => <Btn key={c} active={t.category === c} color="violet" onClick={() => patch(t.id, { category: c })}>{c}</Btn>)}
          </div>
        </div>
      </div>

      <div className="space-y-3" onClick={e => e.stopPropagation()}>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Atanan</label>
          <div className="flex flex-wrap gap-1">
            <Btn active={!t.assigneeId} color="gray" onClick={() => patch(t.id, { assigneeId: null })}>Havuz</Btn>
            {users.map(u => (
              <Btn key={u.id} active={t.assigneeId === u.id} color="indigo" onClick={() => patch(t.id, { assigneeId: u.id })}>
                {u.name.split(" ")[0]}
              </Btn>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider block mb-1.5">Müşteri</label>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            <Btn active={!t.customerId} color="gray" onClick={() => patch(t.id, { customerId: null })}>Bağlama</Btn>
            {customers.map(c => (
              <Btn key={c.id} active={t.customerId === c.id} color="teal" onClick={() => patch(t.id, { customerId: c.id })}>
                {c.name || "(İsimsiz)"}{c.company ? ` · ${c.company}` : ""}
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]     = useState("");
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
    await fetch(`/api/tickets/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    setUpdating(null);
    fetchAll();
  };

  const remove = async (id: number) => {
    if (!confirm("Bu bileti silmek istediğinize emin misiniz?")) return;
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    setExpanded(null);
    fetchAll();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    return (
      (!q || t.subject.toLowerCase().includes(q) || t.fromEmail.toLowerCase().includes(q) || (t.fromName ?? "").toLowerCase().includes(q) || (t.customer?.name ?? "").toLowerCase().includes(q)) &&
      (statusFilter === "Tümü" || t.status === statusFilter) &&
      (catFilter === "Tümü" || t.category === catFilter)
    );
  });

  return (
    <div className="p-4 md:p-7 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Tüm Biletler</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">{filtered.length} / {tickets.length} ticket</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none space-y-3">
        <input
          placeholder="Konu, e-posta, isim veya müşteri ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
        />
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          <div className="flex flex-wrap gap-1">
            {["Tümü", ...STATUSES].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {["Tümü", ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${catFilter === c ? "bg-violet-600 text-white shadow-sm" : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl py-16 text-center text-slate-400 dark:text-gray-600">Ticket bulunamadı</div>
        )}
        {filtered.map(t => {
          const isExp = expanded === t.id;
          return (
            <div key={t.id} className={`bg-white dark:bg-gray-900 border rounded-2xl shadow-sm dark:shadow-none transition-all ${isExp ? "border-indigo-300 dark:border-indigo-600/40" : "border-slate-200 dark:border-gray-800"} ${updating === t.id ? "opacity-50" : ""}`}>
              <div className="p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : t.id)}>
                <div className="flex justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-gray-100 text-sm leading-snug">{t.subject}</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 truncate">{t.fromEmail}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); remove(t.id); }} className="text-slate-300 dark:text-gray-600 hover:text-red-400 text-xl shrink-0">×</button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                  <span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                  <span className="text-xs text-slate-400 dark:text-gray-600 ml-auto">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              {isExp && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                  <EditPanel t={t} users={users} customers={customers} patch={patch} />
                  <ReplyPanel ticketId={t.id} onStatusChange={fetchAll} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
              {["#", "Konu", "Müşteri", "Kategori", "Öncelik", "Durum", "Atanan", "Tarih", ""].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center py-16 text-slate-400 dark:text-gray-600">Ticket bulunamadı</td></tr>
            )}
            {filtered.map(t => (
              <>
                <tr key={t.id}
                  className={`hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${updating === t.id ? "opacity-50" : ""} ${expanded === t.id ? "bg-slate-50 dark:bg-gray-800/20" : ""}`}
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                >
                  <td className="px-4 py-3 text-slate-400 dark:text-gray-600 font-mono text-xs">#{t.id}</td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-slate-800 dark:text-gray-200 font-medium truncate">{t.subject}</p>
                    <p className="text-slate-400 dark:text-gray-600 text-xs truncate">{t.fromEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    {t.customer ? (
                      <Link href={`/musteriler/${t.customer.id}`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 group">
                        <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                          {(t.customer.name || t.fromEmail)[0].toUpperCase()}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">{t.customer.name || "—"}</p>
                      </Link>
                    ) : <span className="text-xs text-slate-300 dark:text-gray-600 italic">—</span>}
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span></td>
                  <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={t.assignee.name} color={t.assignee.color} size="sm" />
                        <span className="text-xs text-slate-500 dark:text-gray-400">{t.assignee.name.split(" ")[0]}</span>
                      </div>
                    ) : <span className="text-xs text-red-400/70">Havuzda</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 dark:text-gray-600 whitespace-nowrap">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); remove(t.id); }} className="text-slate-300 dark:text-gray-700 hover:text-red-400 transition-colors text-xl">×</button>
                  </td>
                </tr>
                {expanded === t.id && (
                  <tr key={`${t.id}-detail`}>
                    <td colSpan={9} className="px-5 py-5 bg-slate-50/60 dark:bg-gray-800/20 border-b border-slate-100 dark:border-gray-800">
                      <EditPanel t={t} users={users} customers={customers} patch={patch} />
                      <ReplyPanel ticketId={t.id} onStatusChange={fetchAll} />
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
