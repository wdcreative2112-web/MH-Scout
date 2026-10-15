import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Phone, MapPin, Heart, ArrowUpRight } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#071912] text-slate-300 pt-16 pb-12 overflow-hidden border-t border-emerald-900/60 mt-auto">
      {/* Specular top glow line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

      {/* Subtle organic ambient glow in footer background */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12">
          {/* Organization Brand */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white p-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.4)] border border-emerald-500/30 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpeg"
                  alt="Logo Resmi Gerakan Pramuka Maslahatul Hidayah"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  MH <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">SCOUT</span>
                </span>
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold -mt-0.5">
                  Gugus Depan Maslahatul Hidayah
                </p>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Sistem informasi & manajemen administrasi kepramukaan terpadu. Membangun generasi muda berkarakter, mandiri, disiplin, dan berjiwa Pancasila melalui kepanduan modern.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Satyaku Kudarmakan, Darmaku Kubaktikan</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Navigasi Utama</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              {[
                { label: "Beranda Utama", href: "/" },
                { label: "Profil & Visi Misi", href: "/profil" },
                { label: "Warta & Berita Kegiatan", href: "/berita" },
                { label: "Materi & Khazanah Pramuka", href: "/artikel" },
                { label: "Galeri Dokumentasi Foto", href: "/galeri" },
                { label: "Donasi & Infak Pangkalan", href: "/donasi" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-slate-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Administrative */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-white font-bold text-xs tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Sekretariat Gugus Depan</span>
            </h3>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span>Sekretariat Gugus Depan Pramuka Pangkalan Sekolah</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <span>+62 (021) 555-PRAMUKA</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <span>sekretariat@mhscout.id</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-scout-900/80 border border-emerald-700/60 hover:bg-emerald-900/60 hover:text-white transition-all shadow-xs"
                >
                  <span>Portal Masuk Petugas / Pembina</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-emerald-950/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} MH SCOUT. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <span>Didedikasikan untuk kemajuan Gerakan Pramuka Indonesia</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
