"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface User { id: number; name: string; color: string; }
interface Customer { id: number; name: string | null; company: string | null; }
interface Task { id: number; status: string; }
interface Step { id: number; name: string; status: string; tasks: Task[]; }
interface Member { user: User; }
interface Project {
  id: number; name: string; description: string | null; status: string;
  createdAt: string; customer: Customer | null;
  members: Member[]; steps: Step[];
}

const STATUS_COLORS: Record<string, string> = {
  "Devam Ediyor": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Tamamlandı":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Beklemede":    "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "İptal":        "bg-red-500/15 text-red-400 border-red-500/30",
};

const AVATAR_COLORS: Record<string, string> = {
  indigo: "bg-indigo-500", violet: "bg-violet-500", teal: "bg-teal-500",
  orange: "bg-orange-500", rose: "bg-rose-500", sky: "bg-sky-500",
};

function calcProgress(steps: Step[]) {
  if (!steps.length) return 0;
  const allTasks = steps.flatMap(s => s.tasks);
  if (!allTasks.length) {
    const done = steps.filter(s => s.status === "Tamamlandı").length;
    return Math.round((done / steps.length) * 100);
  }
  const done = allTasks.filter(t => t.status === "Tamamlandı").length;
  return Math.round((done / allTasks.length) * 100);
}

export default function ProjelerPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", customerId: "", memberIds: [] as number[], steps: [""] });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tümü");

  const fetchAll = useCallback(async () => {
    const [pr, ur, cr] = await Promise.all([
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/users").then(r => r.json()),
      fetch("/api/customers").then(r => r.json()),
    ]);
    setProjects(Array.isArray(pr) ? pr : []);
    setUsers(Array.isArray(ur) ? ur : []);
    setCustomers(Array.isArray(cr) ? cr : []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, description: form.description,
        customerId: form.customerId || null,
        memberIds: form.memberIds,
        steps: form.steps.filter(s => s.trim()).map(s => ({ name: s })),
      }),
    });
    setSaving(false);
    setShowCreate(false);
    setForm({ name: "", description: "", customerId: "", memberIds: [], steps: [""] });
    fetchAll();
  };

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    return (
      (!q || p.name.toLowerCase().includes(q) || (p.customer?.name ?? "").toLowerCase().includes(q)) &&
      (statusFilter === "Tümü" || p.status === statusFilter)
    );
  });

  return (
    <div className="p-4 md:p-7 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Projeler</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">{filtered.length} proje</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-600/20 transition-all">
          + Yeni Proje
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Proje veya müşteri ara..."
          className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-64" />
        {["Tümü", "Devam Ediyor", "Tamamlandı", "Beklemede"].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-700"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-3 py-20 text-center text-slate-400 dark:text-gray-600">
            <div className="text-4xl mb-3">📁</div>
            <p className="font-medium">Proje bulunamadı</p>
          </div>
        )}
        {filtered.map(p => {
          const progress = calcProgress(p.steps);
          const doneTasks = p.steps.flatMap(s => s.tasks).filter(t => t.status === "Tamamlandı").length;
          const totalTasks = p.steps.flatMap(s => s.tasks).length;
          const doneSteps = p.steps.filter(s => s.status === "Tamamlandı").length;

          return (
            <Link key={p.id} href={`/projeler/${p.id}`}
              className="group bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md dark:hover:shadow-none hover:border-indigo-300 dark:hover:border-indigo-600/40 transition-all block">

              {/* Top */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 dark:text-gray-100 text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{p.name}</p>
                  {p.customer && (
                    <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5 truncate">{p.customer.name}{p.customer.company ? ` · ${p.customer.company}` : ""}</p>
                  )}
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ml-2 ${STATUS_COLORS[p.status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>{p.status}</span>
              </div>

              {p.description && (
                <p className="text-xs text-slate-500 dark:text-gray-500 mb-3 line-clamp-2">{p.description}</p>
              )}

              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 dark:text-gray-600 mb-1">
                  <span>{totalTasks > 0 ? `${doneTasks}/${totalTasks} görev` : `${doneSteps}/${p.steps.length} adım`}</span>
                  <span className="font-semibold text-slate-600 dark:text-gray-400">{progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${progress === 100 ? "bg-emerald-500" : "bg-indigo-500"}`}
                    style={{ width: `${progress}%` }} />
                </div>
              </div>

              {/* Steps mini */}
              {p.steps.length > 0 && (
                <div className="flex gap-1 mb-3 flex-wrap">
                  {p.steps.map(s => (
                    <div key={s.id} title={s.name}
                      className={`h-1.5 flex-1 min-w-[12px] rounded-full ${s.status === "Tamamlandı" ? "bg-emerald-500" : s.status === "Devam Ediyor" ? "bg-indigo-400" : "bg-slate-200 dark:bg-gray-700"}`} />
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {p.members.slice(0, 4).map(m => (
                    <div key={m.user.id} title={m.user.name}
                      className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-[10px] font-bold text-white ${AVATAR_COLORS[m.user.color] ?? "bg-slate-500"}`}>
                      {m.user.name[0]}
                    </div>
                  ))}
                  {p.members.length > 4 && (
                    <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900 bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-slate-500">
                      +{p.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 dark:text-gray-600">
                  {new Date(p.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-5">Yeni Proje</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Proje Adı *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Proje adı girin..."
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Açıklama</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Kısa açıklama..."
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Müşteri</label>
                <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                  <option value="">Müşteri seç...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name ?? "-"}{c.company ? ` (${c.company})` : ""}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Ekip Üyeleri</label>
                <div className="flex flex-wrap gap-2">
                  {users.map(u => (
                    <button key={u.id} type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        memberIds: f.memberIds.includes(u.id) ? f.memberIds.filter(id => id !== u.id) : [...f.memberIds, u.id],
                      }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${form.memberIds.includes(u.id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400"}`}>
                      {u.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Proje Adımları</label>
                <div className="space-y-2">
                  {form.steps.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={s} onChange={e => setForm(f => { const st = [...f.steps]; st[i] = e.target.value; return { ...f, steps: st }; })}
                        placeholder={`Adım ${i + 1}`}
                        className="flex-1 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
                      {form.steps.length > 1 && (
                        <button onClick={() => setForm(f => ({ ...f, steps: f.steps.filter((_, j) => j !== i) }))}
                          className="text-slate-300 hover:text-red-400 transition-colors text-xl px-1">×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={() => setForm(f => ({ ...f, steps: [...f.steps, ""] }))}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                    + Adım ekle
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 dark:border-gray-700 rounded-xl transition-colors">
                İptal
              </button>
              <button onClick={save} disabled={saving || !form.name.trim()}
                className="flex-1 py-2.5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-40">
                {saving ? "Oluşturuluyor..." : "Proje Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
