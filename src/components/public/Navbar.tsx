"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Menu, X, LogIn, ChevronRight, BookOpen, Newspaper, Image, Info } from "lucide-react";

export function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Beranda", href: "/" },
    { name: "Profil", href: "/profil", icon: Info },
    { name: "Berita", href: "/berita", icon: Newspaper },
    { name: "Artikel", href: "/artikel", icon: BookOpen },
    { name: "Galeri", href: "/galeri", icon: Image },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-scout-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-scout-800 text-white flex items-center justify-center shadow-md shadow-scout-900/10 group-hover:bg-scout-700 transition-colors">
              <Compass className="w-6 h-6 text-amber-300 transform group-hover:rotate-45 transition-transform duration-300" />
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-scout-900">
                Pramuka<span className="text-scout-600">One</span>
              </span>
              <p className="text-[10px] font-semibold tracking-wider uppercase text-scout-600 -mt-1 hidden sm:block">
                Pangkalan Gerakan Pramuka
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "text-scout-800 bg-scout-50 font-semibold"
                      : "text-slate-600 hover:text-scout-800 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Button & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-scout-800 text-white hover:bg-scout-700 shadow-sm transition-all focus:ring-2 focus:ring-scout-600 focus:outline-hidden"
            >
              <LogIn className="w-4 h-4" />
              <span>Login Petugas</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-scout-900 hover:bg-slate-100 md:hidden focus:outline-hidden"
              aria-label="Buka menu navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-scout-50 text-scout-900 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-scout-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-5 h-5 text-scout-600" />}
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-scout-800 text-white font-medium text-sm shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk ke Dashboard Petugas</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
