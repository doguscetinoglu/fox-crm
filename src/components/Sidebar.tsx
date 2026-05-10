"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/session";
import UserAvatar from "./UserAvatar";

const ALL_NAV = [
  { href: "/",             label: "Dashboard",    icon: "⊞",  roles: ["admin", "agent"] },
  { href: "/havuz",        label: "Havuz",        icon: "⬇",  roles: ["admin", "agent"] },
  { href: "/tickets",      label: "Tüm Biletler", icon: "☰",  roles: ["admin", "agent"] },
  { href: "/musteriler",   label: "Müşteriler",   icon: "◉",  roles: ["admin"] },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: "◎",  roles: ["admin"] },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(setMe);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const nav = ALL_NAV.filter(n => !me || n.roles.includes(me.type));

  const roleLabel = me?.type === "admin" ? "Yönetici" : me?.type === "customer" ? "Müşteri" : "Agent";
  const roleColor = me?.type === "admin" ? "text-amber-400 bg-amber-400/10" : "text-indigo-400 bg-indigo-400/10";

  return (
    <aside className="w-64 md:w-56 h-full min-h-screen bg-gray-900 border-r border-gray-800/80 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
            T
          </div>
          <div>
            <p className="font-bold text-gray-100 text-sm leading-none">Ticket CRM</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Destek Merkezi</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = path === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-gray-400 hover:bg-gray-800/80 hover:text-gray-100"
              }`}
            >
              <span className={`text-sm font-mono ${active ? "text-indigo-200" : "text-gray-600"}`}>{item.icon}</span>
              {item.label}
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Kullanıcı */}
      <div className="px-3 py-4 border-t border-gray-800/80 space-y-2">
        {me && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-800/40">
            <UserAvatar name={me.name} color={(me as SessionUser & { color?: string }).color ?? "indigo"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-200 truncate">{me.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleColor}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Çıkış Yap
        </button>
        <div className="flex items-center gap-2 px-2 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-gray-600">Sistem aktif</span>
        </div>
      </div>
    </aside>
  );
}
