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
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", company: "", phone: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    const res = await fetch("/api/customers").then(r => r.json());
    setCustomers(Array.isArray(res) ? res : []);
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const save = async () => {
    if (!form.email) return;
    setSaving(true);
    await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setAdding(false);
    setForm({ email: "", name: "", company: "", phone: "", notes: "" });
    fetchCustomers();
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q);
  });

  const total = customers.reduce((s, c) => s + c._count.tickets, 0);
  const withTickets = customers.filter(c => c._count.tickets > 0).length;

  return (
    <div className="p-7 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Müşteriler</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} kayıtlı müşteri · {total} toplam ticket</p>
        </div>
        <button onClick={() => setAdding(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors">
          + Müşteri Ekle
        </button>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Toplam Müşteri</p>
          <p className="text-3xl font-bold text-gray-100 mt-1">{customers.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Göndermis</p>
          <p className="text-3xl font-bold text-gray-100 mt-1">{withTickets}</p>
          <p className="text-xs text-gray-600 mt-1">en az 1 ticket</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Ort. Ticket/Müşteri</p>
          <p className="text-3xl font-bold text-gray-100 mt-1">
            {customers.length > 0 ? (total / customers.length).toFixed(1) : "—"}
          </p>
        </div>
      </div>

      {/* Arama */}
      <input
        placeholder="İsim, e-posta veya şirket ara..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600"
      />

      {/* Liste */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {["Müşteri", "E-posta", "Şirket", "Telefon", "Ticket Sayısı", "Açık", "Kayıt Tarihi", ""].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-16 text-gray-600">Müşteri bulunamadı</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(c.name || c.email)[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-200">{c.name || <span className="text-gray-500 italic">İsimsiz</span>}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{c.email}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{c.company || <span className="text-gray-600">—</span>}</td>
                <td className="px-5 py-3 text-gray-400 text-xs">{c.phone || <span className="text-gray-600">—</span>}</td>
                <td className="px-5 py-3">
                  <span className="text-xl font-bold text-indigo-400">{c._count.tickets}</span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${c.openTickets > 0 ? "bg-orange-500/20 text-orange-300" : "bg-gray-800 text-gray-600"}`}>
                    {c.openTickets}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/musteriler/${c.id}`}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">
                    Detay →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Yeni Müşteri Modal */}
      {adding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAdding(false)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-100 mb-5">Yeni Müşteri</h2>
            <div className="space-y-3">
              {[
                { key: "email", label: "E-posta *", placeholder: "musteri@domain.com" },
                { key: "name", label: "Ad Soyad", placeholder: "Ali Yılmaz" },
                { key: "company", label: "Şirket", placeholder: "Firma A.Ş." },
                { key: "phone", label: "Telefon", placeholder: "+90 555 000 00 00" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">{label}</label>
                  <input
                    value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 font-semibold uppercase tracking-wide block mb-1">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={save} disabled={saving || !form.email}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
              <button onClick={() => setAdding(false)}
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
