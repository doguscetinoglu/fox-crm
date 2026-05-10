"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg">T</div>
          <div>
            <p className="font-bold text-gray-100 text-lg leading-none">Ticket CRM</p>
            <p className="text-xs text-gray-500">Destek Merkezi</p>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-gray-100 mb-1">Giriş Yap</h1>
          <p className="text-sm text-gray-500 mb-6">Hesabınıza erişmek için bilgilerinizi girin</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@sirket.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-gray-900/60 border border-gray-800/60 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Demo Hesaplar</p>
          {[
            { label: "Admin", email: "admin@sirket.com", pw: "Admin123!" },
            { label: "Agent", email: "ahmet@sirket.com", pw: "Sifre123!" },
            { label: "Müşteri", email: "ali@musteri.com", pw: "Musteri123!" },
          ].map(c => (
            <button
              key={c.email}
              onClick={() => { setEmail(c.email); setPassword(c.pw); }}
              className="w-full text-left flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
            >
              <span className="text-xs text-gray-400"><span className="font-medium text-gray-300">{c.label}:</span> {c.email}</span>
              <span className="text-xs text-gray-600">{c.pw}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
