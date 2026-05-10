"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  id: number; email: string; name: string | null; company: string | null;
  phone: string | null; notes: string | null; createdAt: string;
  _count: { tickets: number }; openTickets: number;
}

export default function MusterilerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch]       = useState("");
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ email: "", name: "", company: "", phone: "", notes: "" });
  const [saving, setSaving]       = useState(false);

  const fetchCustomers = useCallback(async () => {
    const res = await fetch("/api/customers").then(r => r.json());
    setCustomers(Array.isArray(res) ? res : []);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const save = async () => {
    if (!form.email) return;
    setSaving(true);
    await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setAdding(false);
    setForm({ email: "", name: "", company: "", phone: "", notes: "" });
    fetchCustomers();
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q);
  });

  const total       = customers.reduce((s, c) => s + c._count.tickets, 0);
  const withTickets = customers.filter(c => c._count.tickets > 0).length;

  const inputCls = "w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all";

  return (
    <div className="p-4 md:p-7 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Müşteriler</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-0.5">{customers.length} kayıtlı müşteri · {total} toplam ticket</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-600/20">
          + Müşteri Ekle
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: "Toplam Müşteri", val: customers.length, color: "text-indigo-600 dark:text-indigo-400" },
          { label: "Ticketlı",       val: withTickets,       color: "text-violet-600 dark:text-violet-400" },
          { label: "Ort. Ticket",    val: customers.length > 0 ? (total / customers.length).toFixed(1) : "—", color: "text-teal-600 dark:text-teal-400" },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 md:p-5 shadow-sm dark:shadow-none">
            <p className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl md:text-3xl font-bold mt-1 ${color}`}>{val}</p>
          </div>
        ))}
      </div>

      <input placeholder="İsim, e-posta veya şirket ara..." value={search} onChange={e => setSearch(e.target.value)}
        className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all shadow-sm dark:shadow-none" />

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl py-16 text-center text-slate-400 dark:text-gray-600 shadow-sm dark:shadow-none">Müşteri bulunamadı</div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm dark:shadow-none hover:border-indigo-200 dark:hover:border-gray-700 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {(c.name || c.email)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-gray-200 text-sm">{c.name || <span className="text-slate-400 italic">İsimsiz</span>}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500 truncate">{c.email}</p>
                  {c.company && <p className="text-xs text-slate-400 dark:text-gray-600 truncate">{c.company}</p>}
                </div>
              </div>
              <Link href={`/musteriler/${c.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 shrink-0">Detay →</Link>
            </div>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{c._count.tickets}</span>
              <span className="text-xs text-slate-500 dark:text-gray-500">ticket</span>
              {c.openTickets > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">{c.openTickets} açık</span>}
              <span className="text-xs text-slate-300 dark:text-gray-600 ml-auto">{new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-900">
              {["Müşteri", "E-posta", "Şirket", "Telefon", "Ticket", "Açık", "Kayıt", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-gray-800/60">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-16 text-slate-400 dark:text-gray-600">Müşteri bulunamadı</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(c.name || c.email)[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-gray-200">{c.name || <span className="text-slate-400 italic">İsimsiz</span>}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-500 dark:text-gray-400 text-xs">{c.email}</td>
                <td className="px-5 py-3 text-slate-400 dark:text-gray-500 text-xs">{c.company || "—"}</td>
                <td className="px-5 py-3 text-slate-400 dark:text-gray-500 text-xs">{c.phone || "—"}</td>
                <td className="px-5 py-3"><span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{c._count.tickets}</span></td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.openTickets > 0 ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-600"}`}>
                    {c.openTickets}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-slate-400 dark:text-gray-600 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                <td className="px-5 py-3">
                  <Link href={`/musteriler/${c.id}`} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">Detay →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setAdding(false)}>
          <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-900 dark:text-gray-100 mb-5">Yeni Müşteri</h2>
            <div className="space-y-3">
              {[
                { key: "email",   label: "E-posta *",  placeholder: "musteri@domain.com" },
                { key: "name",    label: "Ad Soyad",   placeholder: "Ali Yılmaz" },
                { key: "company", label: "Şirket",     placeholder: "Firma A.Ş." },
                { key: "phone",   label: "Telefon",    placeholder: "+90 555 000 00 00" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide block mb-1">{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className={inputCls} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-gray-500 uppercase tracking-wide block mb-1">Notlar</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className={`${inputCls} resize-none`} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} disabled={saving || !form.email}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button onClick={() => setAdding(false)}
                className="flex-1 py-2.5 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 font-semibold rounded-xl text-sm transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
