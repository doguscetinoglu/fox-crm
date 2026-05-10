"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import type { SessionUser } from "@/lib/session";

interface Ticket {
  id: number; subject: string; body: string; status: string; priority: string;
  category: string; receivedAt: string; updatedAt: string;
  assignee: { name: string; color: string } | null;
}

const CATEGORIES = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];
const PRIORITIES = ["Normal", "Yüksek", "Kritik"];

export default function PortalPage() {
  const [me, setMe]           = useState<SessionUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ subject: "", body: "", category: "Genel", priority: "Normal" });
  const [saving, setSaving]     = useState(false);
  const [filter, setFilter]     = useState("Tümü");

  const fetchAll = useCallback(async () => {
    const [meRes, tRes] = await Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/tickets").then(r => r.json()),
    ]);
    setMe(meRes);
    setTickets(Array.isArray(tRes) ? tRes : []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    await fetch("/api/tickets/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, fromEmail: me.email, fromName: me.name }),
    });
    setSaving(false);
    setCreating(false);
    setForm({ subject: "", body: "", category: "Genel", priority: "Normal" });
    fetchAll();
  };

  const filtered = filter === "Tümü" ? tickets : tickets.filter(t => t.status === filter);
  const open = tickets.filter(t => t.status === "Yeni" || t.status === "İnceleniyor").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-800 px-4 md:px-6 py-4 shadow-sm dark:shadow-none">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shrink-0">T</div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 dark:text-gray-100 text-sm">Müşteri Portalı</p>
              {me && <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{me.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setCreating(true)}
              className="px-3 py-2 md:px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-600/20">
              + Yeni Talep
            </button>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              className="px-3 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 text-sm rounded-xl transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Toplam", val: tickets.length,                                  color: "text-indigo-600 dark:text-indigo-400" },
            { label: "Açık",   val: open,                                            color: "text-amber-600 dark:text-amber-400" },
            { label: "Kapalı", val: tickets.filter(t => t.status === "Kapalı").length, color: "text-slate-500 dark:text-gray-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-1.5">
          {["Tümü", "Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filter === s ? "bg-indigo-600 text-white shadow-sm" : "bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-gray-700"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Tickets */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl text-center py-16 shadow-sm dark:shadow-none">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-semibold text-slate-700 dark:text-gray-400">Henüz talep yok</p>
              <p className="text-sm text-slate-400 dark:text-gray-600 mt-1">Yeni bir destek talebi oluşturabilirsiniz</p>
            </div>
          ) : filtered.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 md:p-5 shadow-sm dark:shadow-none hover:border-indigo-200 dark:hover:border-gray-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-slate-400 dark:text-gray-600 font-mono">#{t.id}</span>
                    <span className="text-xs bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-gray-100">{t.subject}</p>
                  {t.body && <p className="text-sm text-slate-500 dark:text-gray-500 mt-1 line-clamp-2">{t.body}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-gray-800 gap-2">
                {t.assignee ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{t.assignee.name[0]}</div>
                    <span className="text-xs text-slate-500 dark:text-gray-500 truncate">{t.assignee.name} inceliyor</span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-gray-600">Ekip incelemede</span>
                )}
                <span className="text-xs text-slate-400 dark:text-gray-600 whitespace-nowrap shrink-0">
                  {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New ticket modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setCreating(false)}>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900 dark:text-gray-100 mb-5">Yeni Destek Talebi</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">Konu *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required placeholder="Sorunuzu kısaca özetleyin"
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">Açıklama</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Detaylı açıklama yapın..."
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "category", label: "Kategori", opts: CATEGORIES },
                  { key: "priority", label: "Öncelik",  opts: PRIORITIES },
                ].map(({ key, label, opts }) => (
                  <div key={key}>
                    <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase block mb-1.5">{label}</label>
                    <select value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all">
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving || !form.subject}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                  {saving ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
