"use client";

import { useCallback, useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import type { SessionUser } from "@/lib/session";

interface User {
  id: number; name: string; email: string; role: string; color: string;
  isAdmin: boolean; isActive: boolean; createdAt: string;
  _count: { tickets: number }; openTickets: number;
}
interface Ticket { id: number; subject: string; status: string; priority: string; category: string; receivedAt: string; }

const COLORS = ["blue", "purple", "green", "pink", "orange", "indigo", "teal"];
const COLOR_LABELS: Record<string, string> = { blue: "Mavi", purple: "Mor", green: "Yeşil", pink: "Pembe", orange: "Turuncu", indigo: "İndigo", teal: "Teal" };
const ROLES = ["Agent", "Senior Agent", "Junior Agent", "Team Lead", "Admin"];
const EMPTY_FORM = { name: "", email: "", password: "", role: "Agent", color: "indigo", isAdmin: false };

export default function KullanicilarPage() {
  const [me, setMe] = useState<SessionUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [resetPw, setResetPw] = useState<{ id: number; name: string } | null>(null);
  const [newPw, setNewPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchUsers = useCallback(async () => {
    const [meRes, uRes] = await Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch("/api/users").then(r => r.json()),
    ]);
    setMe(meRes);
    setUsers(Array.isArray(uRes) ? uRes : []);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const selectUser = async (uid: number) => {
    if (selected === uid) { setSelected(null); setTickets([]); return; }
    setSelected(uid);
    const res = await fetch("/api/tickets").then(r => r.json());
    setTickets((Array.isArray(res) ? res : []).filter((t: Ticket & { assigneeId: number | null }) => t.assigneeId === uid));
  };

  const create = async () => {
    setError(""); setSaving(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Hata"); return; }
    setAdding(false); setForm(EMPTY_FORM); fetchUsers();
  };

  const update = async (id: number, data: object) => {
    await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    fetchUsers();
  };

  const doResetPw = async () => {
    if (!resetPw || !newPw) return;
    setSaving(true);
    await update(resetPw.id, { password: newPw });
    setSaving(false); setResetPw(null); setNewPw("");
  };

  const deleteUser = async (id: number, name: string) => {
    if (!confirm(`"${name}" kullanıcısını silmek istediğinize emin misiniz?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  const isAdmin = me?.type === "admin";
  const maxTickets = Math.max(...users.map(u => u._count.tickets), 1);
  const COLOR_BG: Record<string, string> = { blue: "bg-blue-600", purple: "bg-purple-600", green: "bg-emerald-600", pink: "bg-pink-600", orange: "bg-orange-500", indigo: "bg-indigo-600", teal: "bg-teal-600" };

  return (
    <div className="p-7 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Kullanıcılar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} kullanıcı · {users.filter(u => u.isActive).length} aktif</p>
        </div>
        {isAdmin && (
          <button onClick={() => setAdding(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
            + Yeni Kullanıcı
          </button>
        )}
      </div>

      {/* Özet */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Toplam", val: users.length },
          { label: "Aktif", val: users.filter(u => u.isActive).length },
          { label: "Admin", val: users.filter(u => u.isAdmin).length },
          { label: "Toplam Ticket", val: users.reduce((s, u) => s + u._count.tickets, 0) },
        ].map(({ label, val }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-3xl font-bold text-gray-100 mt-1">{val}</p>
          </div>
        ))}
      </div>

      {/* Kullanıcı kartları */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {users.map(u => {
          const pct = Math.round((u._count.tickets / maxTickets) * 100);
          const isSel = selected === u.id;
          return (
            <div key={u.id}
              className={`bg-gray-900 border rounded-2xl p-5 transition-all ${isSel ? "border-indigo-600 ring-1 ring-indigo-600/40" : "border-gray-800 hover:border-gray-700"}`}>
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <UserAvatar name={u.name} color={u.color} size="lg" />
                    {!u.isActive && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900" />}
                    {u.isAdmin && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-gray-900 flex items-center justify-center text-white text-[7px]">A</span>}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-100 text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                    <p className="text-xs text-gray-600">{u.email}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(u); setForm({ name: u.name, email: u.email, password: "", role: u.role, color: u.color, isAdmin: u.isAdmin }); }}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors text-xs">✏️</button>
                    <button onClick={() => setResetPw({ id: u.id, name: u.name })}
                      className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-yellow-400 transition-colors text-xs">🔑</button>
                    <button onClick={() => update(u.id, { isActive: !u.isActive })}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${u.isActive ? "bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-red-400" : "bg-green-500/20 text-green-400 hover:bg-green-500/30"}`}>
                      {u.isActive ? "⏸" : "▶"}
                    </button>
                    {u.id !== me?.id && (
                      <button onClick={() => deleteUser(u.id, u.name)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-colors text-xs">🗑</button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Toplam ticket</span>
                  <span className="font-bold text-gray-200">{u._count.tickets}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${COLOR_BG[u.color] ?? "bg-indigo-600"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${u.openTickets > 0 ? "bg-orange-500/20 text-orange-300" : "bg-gray-800 text-gray-600"}`}>
                    {u.openTickets} açık
                  </span>
                  {!u.isActive && <span className="text-xs px-2 py-0.5 rounded-md bg-red-500/20 text-red-400">Pasif</span>}
                  {u.isAdmin && <span className="text-xs px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400">Admin</span>}
                </div>
                <button onClick={() => selectUser(u.id)}
                  className="w-full mt-1 py-1 text-xs text-gray-500 hover:text-indigo-400 transition-colors">
                  {isSel ? "Gizle ↑" : "Ticketları gör ↓"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Seçili kullanıcı ticketları */}
      {selected && tickets.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <p className="text-sm font-semibold text-gray-200">
              {users.find(u => u.id === selected)?.name} — Ticket Listesi ({tickets.length})
            </p>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              {["#", "Konu", "Kategori", "Durum", "Öncelik", "Tarih"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-800/60">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">#{t.id}</td>
                  <td className="px-5 py-3 text-gray-200 max-w-[200px]"><p className="truncate">{t.subject}</p></td>
                  <td className="px-5 py-3"><span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3 text-xs text-gray-600">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yeni Kullanıcı Modal */}
      {(adding || editing) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setAdding(false); setEditing(null); setError(""); }}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-100 mb-5">{editing ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Ad Soyad *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ali Yılmaz"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">E-posta *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ali@sirket.com"
                    disabled={!!editing}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 disabled:opacity-50" />
                </div>
                {!editing && (
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Şifre *</label>
                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Rol</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-600">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Renk</label>
                  <select value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-600">
                    {COLORS.map(c => <option key={c} value={c}>{COLOR_LABELS[c]}</option>)}
                  </select>
                </div>
              </div>

              {/* Renk önizleme */}
              <div className="flex items-center gap-2 pt-1">
                <UserAvatar name={form.name || "?"} color={form.color} size="md" />
                <div>
                  <p className="text-sm font-medium text-gray-300">{form.name || "Önizleme"}</p>
                  <p className="text-xs text-gray-500">{form.role}</p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div className={`w-9 h-5 rounded-full transition-colors ${form.isAdmin ? "bg-orange-500" : "bg-gray-700"} relative`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isAdmin ? "left-4" : "left-0.5"}`} />
                </div>
                <input type="checkbox" className="hidden" checked={form.isAdmin} onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))} />
                <span className="text-sm text-gray-400">Admin yetkisi</span>
              </label>

              {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={editing ? () => { update(editing.id, { name: form.name, role: form.role, color: form.color, isAdmin: form.isAdmin }); setEditing(null); } : create}
                disabled={saving || !form.name || (!editing && !form.password)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? "Kaydediliyor..." : editing ? "Güncelle" : "Oluştur"}
              </button>
              <button onClick={() => { setAdding(false); setEditing(null); setError(""); }}
                className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şifre sıfırlama modal */}
      {resetPw && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setResetPw(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-100 mb-1">Şifre Sıfırla</h2>
            <p className="text-sm text-gray-500 mb-5">{resetPw.name} için yeni şifre belirleyin</p>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Yeni şifre"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 mb-4" />
            <div className="flex gap-2">
              <button onClick={doResetPw} disabled={saving || !newPw}
                className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? "..." : "Sıfırla"}
              </button>
              <button onClick={() => setResetPw(null)}
                className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold rounded-xl text-sm transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
