"use client";

import { useCallback, useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { PriorityBadge } from "@/components/StatusBadge";

interface User { id: number; name: string; color: string; role: string; }
interface Ticket {
  id: number; subject: string; body: string; fromEmail: string; fromName: string | null;
  category: string; priority: string; receivedAt: string;
}

const CATEGORY_OPTIONS = ["Genel", "Teknik Destek", "Fatura", "Öneri", "Şikayet"];

export default function HavuzPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Tümü");

  const fetchAll = useCallback(async () => {
    const [tRes, uRes] = await Promise.all([
      fetch("/api/tickets").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
    ]);
    setTickets((tRes as (Ticket & { assigneeId: number | null })[]).filter(t => !t.assigneeId));
    setUsers(uRes);
  }, []);

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 15000); return () => clearInterval(t); }, [fetchAll]);

  const assign = async (ticketId: number, userId: number) => {
    setAssigning(true);
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: userId, status: "İnceleniyor" }),
    });
    setAssigning(false);
    setSelected(null);
    fetchAll();
  };

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.fromEmail.toLowerCase().includes(q) || (t.fromName ?? "").toLowerCase().includes(q);
    const matchCat = catFilter === "Tümü" || t.category === catFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Havuz</h1>
          <p className="text-sm text-gray-500 mt-0.5">Atama bekleyen mailler — {tickets.length} ticket</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">{tickets.length} atanmamış</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Konu, e-posta veya isim ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 w-72"
        />
        <div className="flex gap-1">
          {["Tümü", ...CATEGORY_OPTIONS].map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${catFilter === c ? "bg-indigo-600 text-white" : "bg-gray-900 border border-gray-800 text-gray-400 hover:border-gray-600"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <span className="text-5xl mb-3">📭</span>
          <p className="text-lg font-medium">Havuz boş</p>
          <p className="text-sm mt-1">Atanmamış ticket bulunmuyor</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(t => (
            <div key={t.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                  {(t.fromName || t.fromEmail)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-100">{t.subject}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{t.fromName || t.fromEmail} · {t.fromEmail}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <PriorityBadge priority={t.priority} />
                      <span className="text-xs text-gray-600">
                        {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {t.body && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{t.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span>
                    <span className="text-xs text-gray-600">#{t.id}</span>
                    <div className="ml-auto flex gap-2">
                      <button
                        onClick={() => setSelected(t)}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Ata
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-100 mb-1">Ticket Ata</h2>
            <p className="text-sm text-gray-500 mb-5 truncate">#{selected.id} — {selected.subject}</p>
            <div className="space-y-2">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => assign(selected.id, u.id)}
                  disabled={assigning}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all text-left disabled:opacity-50"
                >
                  <UserAvatar name={u.name} color={u.color} />
                  <div>
                    <p className="text-sm font-medium text-gray-200">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors">İptal</button>
          </div>
        </div>
      )}
    </div>
  );
}
