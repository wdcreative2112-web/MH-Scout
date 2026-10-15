import React from "react";
import { ShieldCheck, Mail, Phone, MapPin, Heart } from "lucide-react";

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#071912] text-slate-300 pt-16 pb-12 overflow-hidden border-t border-emerald-900/60 mt-auto">
      {/* Specular top glow line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent pointer-events-none" />

      {/* Subtle organic ambient glow in footer background */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-10 lg:gap-16">
          {/* Organization Brand */}
          <div className="max-w-md space-y-5">
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

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Sistem informasi & manajemen administrasi kepramukaan terpadu. Membangun generasi muda berkarakter, mandiri, disiplin, dan berjiwa Pancasila melalui kepanduan modern.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 bg-emerald-950/60 px-3.5 py-1.5 rounded-full border border-emerald-800/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Satyaku Kudarmakan, Darmaku Kubaktikan</span>
            </div>
          </div>

          {/* Contact & Secretariat */}
          <div className="space-y-4 max-w-sm">
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
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Dedication & Developer Attribution */}
        <div className="mt-12 pt-8 border-t border-emerald-950/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {currentYear} MH SCOUT. Hak Cipta Dilindungi Undang-Undang.</p>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 gap-y-2 text-slate-400">
            <p className="flex items-center gap-1.5 text-slate-400">
              <span>Didedikasikan untuk kemajuan Gerakan Pramuka Indonesia</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </p>
            <span className="hidden md:inline text-slate-700">•</span>
            <p className="flex items-center gap-2">
              <span>
                Web Aplikasi dikembangkan oleh{" "}
                <span className="text-emerald-300 font-bold tracking-wide">ZUBED SA</span>
              </span>
              <a
                href="https://wa.me/6281717594886"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-950/90 hover:bg-[#25D366] text-[#25D366] hover:text-white border border-emerald-700/60 transition-all shadow-xs group"
                title="Hubungi Pengembang (ZUBED SA) di WhatsApp: 081717594886"
                aria-label="WhatsApp ZUBED SA"
              >
                <svg
                  className="w-4 h-4 fill-current group-hover:scale-110 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.98.578 3.826 1.574 5.378L2.054 22l4.802-1.488A9.957 9.957 0 0012.004 22c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm5.82 14.28c-.244.686-1.42 1.32-1.956 1.408-.518.084-1.18.12-3.412-.806-2.618-1.086-4.306-3.738-4.436-3.912-.13-.174-1.056-1.406-1.056-2.68 0-1.276.666-1.902.906-2.164.24-.26.524-.326.7-.326.176 0 .35.002.504.01.164.008.384-.062.6.458.22.532.752 1.834.818 1.968.066.134.11.29.022.466-.088.176-.132.286-.264.44-.132.154-.278.344-.396.462-.132.13-.27.272-.116.536.154.264.684 1.126 1.468 1.824 1.01.898 1.86 1.176 2.124 1.308.264.132.418.11.572-.066.154-.176.66-.77.836-1.034.176-.264.352-.22.594-.132.242.088 1.54.726 1.804.858.264.132.44.198.506.308.066.11.066.638-.178 1.324z" />
                </svg>
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
