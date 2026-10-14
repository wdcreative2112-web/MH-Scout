"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserSession } from "@/types";
import { logoutAction } from "@/actions/auth";
import {
  Compass,
  LayoutDashboard,
  Users,
  Shield,
  Award,
  Calendar,
  CheckSquare,
  BookOpen,
  Mail,
  Wallet,
  FileText,
  Newspaper,
  Image as ImageIcon,
  Settings,
  UserCog,
  LogOut,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface SidebarProps {
  session: UserSession;
  onCloseMobile?: () => void;
}

export function DashboardSidebar({ session, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const role = session.role;

  // Filter menu items by role
  const menuSections = [
    {
      title: "Ringkasan",
      items: [
        {
          name: role === "KETUA_REGU" ? "Dashboard Regu" : "Dashboard Utama",
          href:
            role === "ADMIN"
              ? "/dashboard/admin"
              : role === "SEKRETARIS"
              ? "/dashboard/sekretaris"
              : role === "KETUA_REGU"
              ? "/dashboard/ketua-regu"
              : "/dashboard/bendahara",
          icon: LayoutDashboard,
          show: true,
        },
      ],
    },
    {
      title: role === "KETUA_REGU" ? "Administrasi Regu" : "Administrasi & Anggota",
      items: [
        {
          name: role === "KETUA_REGU" ? "Presensi Latihan Regu" : "Absensi Mingguan",
          href: "/dashboard/attendance",
          icon: CheckSquare,
          show: role === "ADMIN" || role === "SEKRETARIS" || role === "KETUA_REGU",
        },
        {
          name: role === "KETUA_REGU" ? "Anggota Regu Saya" : "Data Anggota",
          href: "/dashboard/members",
          icon: Users,
          show: true,
        },
        {
          name: "Kegiatan Pramuka",
          href: "/dashboard/activities",
          icon: Calendar,
          show: role === "ADMIN" || role === "SEKRETARIS" || role === "KETUA_REGU",
        },
        {
          name: "SKU & SKK",
          href: "/dashboard/skills",
          icon: BookOpen,
          show: role === "ADMIN" || role === "SEKRETARIS" || role === "KETUA_REGU",
        },
        {
          name: "Regu & Sangga",
          href: "/dashboard/groups",
          icon: Shield,
          show: role === "ADMIN" || role === "SEKRETARIS",
        },
        {
          name: "Pembina Satuan",
          href: "/dashboard/leaders",
          icon: Award,
          show: role === "ADMIN" || role === "SEKRETARIS",
        },
        {
          name: "Administrasi Surat",
          href: "/dashboard/letters",
          icon: Mail,
          show: role === "ADMIN" || role === "SEKRETARIS",
        },
      ],
    },
    {
      title: "Administrasi Keuangan",
      items: [
        { name: "Keuangan & Kas", href: "/dashboard/finance", icon: Wallet, show: role === "ADMIN" || role === "BENDAHARA" },
        { name: "Iuran Anggota", href: "/dashboard/dues", icon: FileText, show: role === "ADMIN" || role === "BENDAHARA" },
        { name: "Laporan Keuangan", href: "/dashboard/reports", icon: FileText, show: role === "ADMIN" || role === "BENDAHARA" || role === "SEKRETARIS" },
      ],
    },
    {
      title: "Publikasi & Media",
      items: [
        { name: "Kelola Berita", href: "/dashboard/news", icon: Newspaper, show: role === "ADMIN" || role === "SEKRETARIS" },
        { name: "Kelola Artikel", href: "/dashboard/articles", icon: BookOpen, show: role === "ADMIN" || role === "SEKRETARIS" },
        { name: "Galeri Dokumentasi", href: "/dashboard/gallery", icon: ImageIcon, show: role === "ADMIN" || role === "SEKRETARIS" },
      ],
    },
    {
      title: "Sistem & Pengaturan",
      items: [
        { name: "Manajemen Pengguna", href: "/dashboard/users", icon: UserCog, show: role === "ADMIN" },
        { name: "Profil Organisasi", href: "/dashboard/settings", icon: Settings, show: role === "ADMIN" },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-scout-800 text-white flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">
              Pramuka<span className="text-emerald-400">One</span>
            </span>
            <p className="text-[10px] font-semibold text-slate-400 -mt-1">Dashboard Terpadu</p>
          </div>
        </Link>
      </div>

      {/* User Badge Profile */}
      <div className="p-4 mx-3 my-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-scout-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {session.name.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{session.name}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                {role === "KETUA_REGU" ? "KETUA REGU" : role}
              </span>
              {session.groupName && (
                <span className="text-[10px] text-amber-300 font-bold truncate">
                  ({session.groupName})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter((item) => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-600 text-white font-semibold shadow-xs"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Lihat Website Publik</span>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
