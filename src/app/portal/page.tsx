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
  const [me, setMe] = useState<SessionUser | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", body: "", category: "Genel", priority: "Normal" });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("Tümü");

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
      body: JSON.stringify({
        ...form,
        fromEmail: me.email,
        fromName: me.name,
      }),
    });
    setSaving(false);
    setCreating(false);
    setForm({ subject: "", body: "", category: "Genel", priority: "Normal" });
    fetchAll();
  };

  const filtered = filter === "Tümü" ? tickets : tickets.filter(t => t.status === filter);
  const open = tickets.filter(t => t.status === "Yeni" || t.status === "İnceleniyor").length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">T</div>
            <div>
              <p className="font-semibold text-gray-100 text-sm">Müşteri Portalı</p>
              {me && <p className="text-xs text-gray-500">{me.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setCreating(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
              + Yeni Talep
            </button>
            <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-xl transition-colors">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Toplam Talep", val: tickets.length, color: "text-indigo-400" },
            { label: "Açık", val: open, color: "text-orange-400" },
            { label: "Kapalı", val: tickets.filter(t => t.status === "Kapalı").length, color: "text-gray-400" },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-bold mt-1 ${color}`}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filtreler */}
        <div className="flex gap-2">
          {["Tümü", "Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${filter === s ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Ticket listesi */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-600">
              <p className="text-4xl mb-3">📭</p>
              <p className="font-medium">Henüz talep yok</p>
              <p className="text-sm mt-1">Yeni bir destek talebi oluşturabilirsiniz</p>
            </div>
          ) : filtered.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600 font-mono">#{t.id}</span>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                  </div>
                  <p className="font-semibold text-gray-100">{t.subject}</p>
                  {t.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.body}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
                {t.assignee ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {t.assignee.name[0]}
                    </div>
                    <span className="text-xs text-gray-500">{t.assignee.name} inceliyor</span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-600">Ekip incelemede</span>
                )}
                <span className="text-xs text-gray-600">
                  {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yeni talep modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-100 mb-5">Yeni Destek Talebi</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Konu *</label>
                <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required
                  placeholder="Sorunuzu kısaca özetleyin"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Açıklama</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4}
                  placeholder="Detaylı açıklama yapın..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Kategori</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1.5">Öncelik</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving || !form.subject}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                  {saving ? "Gönderiliyor..." : "Gönder"}
                </button>
                <button type="button" onClick={() => setCreating(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors">
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
