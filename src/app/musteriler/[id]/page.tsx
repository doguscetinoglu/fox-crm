"use client";

import { useCallback, useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/StatusBadge";
import UserAvatar from "@/components/UserAvatar";
import type { SessionUser } from "@/lib/session";

interface Customer {
  id: number; email: string; name: string | null; company: string | null;
  phone: string | null; notes: string | null; monthlyPrice: number | null;
  createdAt: string; _count: { tickets: number };
  tickets: {
    id: number; subject: string; status: string; priority: string; category: string;
    receivedAt: string; assignee: { name: string; color: string } | null;
  }[];
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [me, setMe] = useState<SessionUser | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", notes: "", monthlyPrice: "", portalPassword: "" });
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("Tümü");

  const fetchCustomer = useCallback(async () => {
    const [meRes, cRes] = await Promise.all([
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null),
      fetch(`/api/customers/${id}`).then(r => r.json()),
    ]);
    setMe(meRes);
    setCustomer(cRes);
    setForm({
      name: cRes.name ?? "",
      company: cRes.company ?? "",
      phone: cRes.phone ?? "",
      notes: cRes.notes ?? "",
      monthlyPrice: cRes.monthlyPrice?.toString() ?? "",
      portalPassword: "",
    });
  }, [id]);

  useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setEditing(false);
    fetchCustomer();
  };

  if (!customer) return <div className="p-8 text-gray-500 text-sm">Yükleniyor...</div>;

  const isAdmin = me?.type === "admin";
  const thisMonth = new Date();
  const monthlyTickets = customer.tickets.filter(t => {
    const d = new Date(t.receivedAt);
    return d.getMonth() === thisMonth.getMonth() && d.getFullYear() === thisMonth.getFullYear();
  }).length;

  const costPerTicket = customer.monthlyPrice && monthlyTickets > 0
    ? (customer.monthlyPrice / monthlyTickets).toFixed(2)
    : null;

  const openCount = customer.tickets.filter(t => t.status === "Yeni" || t.status === "İnceleniyor").length;
  const filtered = statusFilter === "Tümü" ? customer.tickets : customer.tickets.filter(t => t.status === statusFilter);

  return (
    <div className="p-7 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/musteriler" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Müşteriler</Link>
      </div>

      {/* Profil */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-2xl font-bold">
              {(customer.name || customer.email)[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100">{customer.name || <span className="text-gray-500 italic">İsimsiz</span>}</h1>
              <p className="text-sm text-gray-400">{customer.email}</p>
              {customer.company && <p className="text-sm text-gray-500">{customer.company}</p>}
              {customer.phone && <p className="text-xs text-gray-600 mt-0.5">{customer.phone}</p>}
            </div>
          </div>
          {isAdmin && (
            <button onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors">
              {editing ? "İptal" : "Düzenle"}
            </button>
          )}
        </div>

        {customer.notes && !editing && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Notlar</p>
            <p className="text-sm text-gray-400">{customer.notes}</p>
          </div>
        )}

        {editing && (
          <div className="mt-5 pt-5 border-t border-gray-800 grid grid-cols-2 gap-3">
            {[
              { key: "name", label: "Ad Soyad" },
              { key: "company", label: "Şirket" },
              { key: "phone", label: "Telefon" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">{label}</label>
                <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-600" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Aylık Anlaşma Ücreti (₺)</label>
              <input type="number" value={form.monthlyPrice} onChange={e => setForm(f => ({ ...f, monthlyPrice: e.target.value }))} placeholder="5000"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-600" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Notlar</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-600 resize-none" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500 font-semibold uppercase block mb-1">Portal Şifresi (değiştirmek için doldurun)</label>
              <input type="password" value={form.portalPassword} onChange={e => setForm(f => ({ ...f, portalPassword: e.target.value }))}
                placeholder="Boş bırakın → mevcut şifre korunur"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-600" />
            </div>
            <div className="col-span-2">
              <button onClick={save} disabled={saving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-colors">
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI + Maliyet */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Toplam Ticket</p>
          <p className="text-3xl font-bold text-indigo-400 mt-1">{customer._count.tickets}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Bu Ay</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{monthlyTickets}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Açık</p>
          <p className="text-3xl font-bold text-orange-400 mt-1">{openCount}</p>
        </div>
        {isAdmin && (
          <>
            <div className={`bg-gray-900 border rounded-2xl p-5 ${customer.monthlyPrice ? "border-teal-600/40" : "border-gray-800"}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Aylık Anlaşma</p>
              <p className={`text-2xl font-bold mt-1 ${customer.monthlyPrice ? "text-teal-400" : "text-gray-600"}`}>
                {customer.monthlyPrice ? `₺${customer.monthlyPrice.toLocaleString("tr-TR")}` : "—"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">aylık sabit ücret</p>
            </div>
            <div className={`bg-gray-900 border rounded-2xl p-5 ${costPerTicket ? "border-violet-600/40" : "border-gray-800"}`}>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Ticket Başı Maliyet</p>
              <p className={`text-2xl font-bold mt-1 ${costPerTicket ? "text-violet-400" : "text-gray-600"}`}>
                {costPerTicket ? `₺${Number(costPerTicket).toLocaleString("tr-TR")}` : "—"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {customer.monthlyPrice && monthlyTickets > 0
                  ? `₺${customer.monthlyPrice.toLocaleString()} ÷ ${monthlyTickets} ticket`
                  : customer.monthlyPrice ? "Bu ay ticket yok" : "Anlaşma fiyatı girin"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Ticket geçmişi */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-200">Ticket Geçmişi</h2>
          <div className="flex gap-1">
            {["Tümü", "Yeni", "İnceleniyor", "Yanıtlandı", "Kapalı"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${statusFilter === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-600 text-sm">Ticket bulunamadı</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-800">
              {["#", "Konu", "Kategori", "Durum", "Öncelik", "Atanan", "Tarih"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">#{t.id}</td>
                  <td className="px-5 py-3 max-w-[200px]"><p className="text-gray-200 truncate">{t.subject}</p></td>
                  <td className="px-5 py-3"><span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-md">{t.category}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3">
                    {t.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={t.assignee.name} color={t.assignee.color} size="sm" />
                        <span className="text-xs text-gray-400">{t.assignee.name.split(" ")[0]}</span>
                      </div>
                    ) : <span className="text-xs text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                    {new Date(t.receivedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
