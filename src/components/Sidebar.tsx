"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SessionUser } from "@/lib/session";
import UserAvatar from "./UserAvatar";

const ALL_NAV = [
  { href: "/",            label: "Dashboard",    icon: "▦",  roles: ["admin", "agent"] },
  { href: "/havuz",       label: "Havuz",        icon: "📥", roles: ["admin", "agent"] },
  { href: "/tickets",     label: "Tüm Biletler", icon: "🎫", roles: ["admin", "agent"] },
  { href: "/musteriler",  label: "Müşteriler",   icon: "👤", roles: ["admin"] },
  { href: "/kullanicilar",label: "Kullanıcılar", icon: "👥", roles: ["admin"] },
];

export default function Sidebar() {
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

  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">T</div>
          <div>
            <p className="font-semibold text-gray-100 text-sm leading-none">Ticket CRM</p>
            <p className="text-xs text-gray-500 mt-0.5">Destek Merkezi</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map((item) => {
          const active = path === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Kullanıcı bilgisi + logout */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-3">
        {me && (
          <div className="flex items-center gap-2.5 px-2">
            <UserAvatar name={me.name} color={(me as SessionUser & { color?: string }).color ?? "indigo"} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-300 truncate">{me.name}</p>
              <p className={`text-[10px] font-medium ${me.type === "admin" ? "text-orange-400" : me.type === "customer" ? "text-teal-400" : "text-indigo-400"}`}>
                {me.type === "admin" ? "Admin" : me.type === "customer" ? "Müşteri" : "Agent"}
              </p>
            </div>
          </div>
        )}
        <button onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-800 hover:text-red-400 transition-all">
          <span>🚪</span> Çıkış Yap
        </button>
        <div className="flex items-center gap-2 px-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-gray-600">localhost:3000</span>
        </div>
      </div>
    </aside>
  );
}
