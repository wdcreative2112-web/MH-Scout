"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogIn, ChevronRight, BookOpen, Newspaper, Image as ImageIcon, Info, Sparkles, Heart } from "lucide-react";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Profil", href: "/profil", icon: Info },
    { name: "Berita", href: "/berita", icon: Newspaper },
    { name: "Artikel", href: "/artikel", icon: BookOpen },
    { name: "Galeri", href: "/galeri", icon: ImageIcon },
    { name: "Donasi", href: "/donasi", icon: Heart },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? "bg-white/80 backdrop-blur-xl border-b border-white/60 shadow-[0_10px_30px_-10px_rgba(15,36,29,0.08)] py-1"
        : "bg-white/65 backdrop-blur-lg border-b border-slate-200/60 py-2"
        }`}
    >
      {/* Specular top sheen line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo with Glossy Icon Container */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Official Brand Logo */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white p-0.5 shadow-[0_4px_16px_rgba(30,79,58,0.2)] border border-emerald-950/15 group-hover:shadow-[0_6px_22px_rgba(30,79,58,0.3)] group-hover:border-emerald-600/30 transition-all flex items-center justify-center overflow-hidden shrink-0">
              <img
                src="/logo.jpeg"
                alt="Logo Resmi Gerakan Pramuka Maslahatul Hidayah"
                className="w-full h-full object-contain rounded-xl transform group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-black tracking-tight text-scout-950">
                  MH <span className="bg-gradient-to-r from-scout-700 to-emerald-600 bg-clip-text text-transparent">SCOUT</span>
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-wider uppercase text-slate-500 -mt-0.5 hidden sm:block">
                Pangkalan Gerakan Pramuka
              </p>
            </div>
          </Link>

          {/* Desktop Navigation with Glossy Pill Background */}
          <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100/70 border border-slate-200/60 backdrop-blur-md shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${isActive
                    ? "text-scout-950 bg-white shadow-[0_2px_10px_rgba(15,36,29,0.08),inset_0_1px_1px_rgba(255,255,255,0.9)] border border-slate-200/80"
                    : "text-slate-600 hover:text-scout-900 hover:bg-white/50"
                    }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Button & Mobile Toggle */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl text-white glossy-button-primary"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-300" />
              <span>Login Petugas</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-700 hover:text-scout-900 hover:bg-white md:hidden shadow-xs active:scale-95 transition-all focus:outline-hidden"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-scout-800" /> : <Menu className="w-5 h-5 text-scout-800" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown with Glassmorphic Card Finish */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-5 animate-in slide-in-from-top-2 duration-200">
          <div className="glossy-panel rounded-2xl p-4 shadow-xl border border-white/90 bg-white/95 backdrop-blur-2xl space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? "bg-emerald-50 text-emerald-950 border border-emerald-200/60 shadow-xs"
                    : "text-slate-700 hover:bg-slate-50 hover:text-scout-900"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {Icon && <Icon className="w-4 h-4" />}
                    </div>
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-700" : "text-slate-400"}`} />
                </Link>
              );
            })}

            <div className="pt-3 mt-2 border-t border-slate-200/60">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-xs glossy-button-primary"
              >
                <LogIn className="w-4 h-4 text-amber-300" />
                <span>Masuk ke Dashboard Petugas</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
