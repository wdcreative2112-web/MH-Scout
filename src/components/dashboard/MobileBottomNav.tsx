"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSession } from "@/types";
import { LayoutDashboard, Users, CheckSquare, Wallet, Calendar } from "lucide-react";

export function MobileBottomNav({ session }: { session: UserSession }) {
  const pathname = usePathname();
  const role = session.role;

  const mainDashboardHref =
    role === "ADMIN"
      ? "/dashboard/admin"
      : role === "SEKRETARIS"
      ? "/dashboard/sekretaris"
      : role === "KETUA_REGU"
      ? "/dashboard/ketua-regu"
      : "/dashboard/bendahara";

  const navItems = [
    { label: "Ringkasan", href: mainDashboardHref, icon: LayoutDashboard },
    { label: role === "KETUA_REGU" ? "Regu" : "Anggota", href: "/dashboard/members", icon: Users },
    { label: "Presensi", href: "/dashboard/attendance", icon: CheckSquare, hide: role === "BENDAHARA" },
    {
      label: role === "KETUA_REGU" ? "Kegiatan" : "Keuangan",
      href: role === "KETUA_REGU" ? "/dashboard/activities" : "/dashboard/finance",
      icon: role === "KETUA_REGU" ? Calendar : Wallet,
      hide: role === "SEKRETARIS",
    },
  ].filter((item) => !item.hide);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 lg:hidden px-2 py-1 shadow-lg flex items-center justify-around safe-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg text-[10px] font-semibold transition-all ${
              isActive ? "text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
