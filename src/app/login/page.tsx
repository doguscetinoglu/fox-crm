"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Giriş başarısız"); return; }
      router.push(data.type === "customer" ? "/portal" : "/");
      router.refresh();
    } catch {
      setError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/25 mb-4">
            T
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Ticket CRM</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Müşteri Destek Merkezi</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm dark:shadow-none">
          <h2 className="text-lg font-bold text-slate-800 dark:text-gray-100 mb-1">Giriş Yap</h2>
          <p className="text-sm text-slate-500 dark:text-gray-500 mb-6">Hesabınıza erişmek için bilgilerinizi girin</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wide block mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@sirket.com"
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-indigo-600/20"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-white dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800/60 rounded-xl p-4 shadow-sm dark:shadow-none">
          <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide mb-2">Demo Hesaplar</p>
          {[
            { label: "Admin", email: "admin@sirket.com", pw: "Admin123!", color: "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300" },
            { label: "Agent", email: "ahmet@sirket.com", pw: "Sifre123!", color: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" },
            { label: "Müşteri", email: "ali@musteri.com", pw: "Musteri123!", color: "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300" },
          ].map(c => (
            <button
              key={c.email}
              onClick={() => { setEmail(c.email); setPassword(c.pw); }}
              className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800/60 transition-colors"
            >
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${c.color}`}>{c.label}</span>
              <span className="text-xs text-slate-500 dark:text-gray-400 flex-1 truncate">{c.email}</span>
              <span className="text-xs text-slate-300 dark:text-gray-600 font-mono">{c.pw}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
