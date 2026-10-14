import React from "react";
import Link from "next/link";
import { Compass, ShieldCheck, Mail, Phone, MapPin, Heart } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-scout-950 text-slate-300 pt-16 pb-12 border-t border-scout-900 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Organization Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-scout-800 text-white flex items-center justify-center">
                <Compass className="w-6 h-6 text-amber-300" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Pramuka<span className="text-scout-400">One</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Sistem informasi dan manajemen administrasi kepramukaan terpadu. Membangun generasi muda yang berkarakter,
              disiplin, terampil, dan berjiwa Pancasila melalui pendidikan kepanduan yang modern dan akuntabel.
            </p>
            <div className="flex items-center gap-2 text-xs text-scout-300 bg-scout-900/60 px-3 py-1.5 rounded-md inline-flex border border-scout-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Satyaku Kudarmakan, Darmaku Kubaktikan</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Navigasi Utama</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link href="/profil" className="hover:text-emerald-400 transition-colors">
                  Profil & Visi Misi
                </Link>
              </li>
              <li>
                <Link href="/berita" className="hover:text-emerald-400 transition-colors">
                  Warta & Berita Kegiatan
                </Link>
              </li>
              <li>
                <Link href="/artikel" className="hover:text-emerald-400 transition-colors">
                  Materi & Artikel Kepramukaan
                </Link>
              </li>
              <li>
                <Link href="/galeri" className="hover:text-emerald-400 transition-colors">
                  Galeri Dokumentasi
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Administrative */}
          <div>
            <h3 className="text-white font-semibold text-sm tracking-wider uppercase mb-4">Pangkalan Sekretariat</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sekretariat Gugus Depan Pramuka Pangkalan Sekolah</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+62 (021) 555-PRAMUKA</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>sekretariat@pramukaone.id</span>
              </li>
              <li className="pt-2">
                <Link
                  href="/login"
                  className="inline-block text-xs font-medium text-emerald-300 hover:text-white underline underline-offset-4"
                >
                  Portal Dashboard Administrasi &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-scout-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} PramukaOne. Hak Cipta Dilindungi Undang-Undang.</p>
          <p className="flex items-center gap-1">
            Dibangun untuk kemajuan Gerakan Pramuka Indonesia
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
