"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare, CheckCircle2, ShieldCheck } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.warn("Service Worker registration error:", err);
        });
    }

    // 2. Check if already installed / standalone
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    // 4. Capture beforeinstallprompt event for Android / Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsOpen(false);
      localStorage.setItem("mh_pwa_installed", "true");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if dismissed previously during current session
    const dismissedThisSession = sessionStorage.getItem("mh_pwa_dismissed");
    const alreadyInstalled = localStorage.getItem("mh_pwa_installed");

    if (!dismissedThisSession && !alreadyInstalled) {
      // Auto open prompt after a smooth delay so user perceives the login page first
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasPrompted(true);
      }, 900);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    } else {
      setHasPrompted(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setIsOpen(false);
          localStorage.setItem("mh_pwa_installed", "true");
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Installation prompt error:", err);
      }
    } else if (isIos) {
      // Keep modal open to show iOS instructions
    } else {
      // Fallback instruction for desktop or browsers with URL bar install button
      alert(
        "Untuk memasang aplikasi MH SCOUT:\n\n1. Klik ikon 'Install' atau tanda '+' di bilah alamat browser Anda (pojok kanan atas).\n2. Atau buka menu browser (titik tiga) lalu pilih 'Pasang / Install MH SCOUT'."
      );
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("mh_pwa_dismissed", "true");
  };

  // If already running in standalone PWA, don't display anything
  if (isStandalone || isInstalled) {
    return null;
  }

  return (
    <>
      {/* Floating Reopen Button if user dismissed the popup */}
      {!isOpen && hasPrompted && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold shadow-xl border border-emerald-600/40 hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
          title="Pasang Aplikasi MH SCOUT (PWA)"
        >
          <Smartphone className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Pasang Aplikasi</span>
        </button>
      )}

      {/* Main Installation Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-install-title"
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleDismiss}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Tutup popup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-scout-950 via-scout-900 to-emerald-900 p-6 sm:p-7 text-white text-center overflow-hidden">
              {/* Subtle decorative circles in background */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Logo with scout glow badge */}
              <div className="relative w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center mx-auto mb-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)] border border-white/20">
                <img
                  src="/logo.jpeg"
                  alt="Logo MH SCOUT"
                  className="w-full h-full object-contain rounded-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-2">
                <span>Progressive Web App</span>
              </div>

              <h2 id="pwa-install-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Pasang MH SCOUT
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
                Akses portal petugas lebih cepat, ringan, dan langsung dari Layar Utama HP / Laptop Anda.
              </p>
            </div>

            {/* Body Content */}
            <div className="p-6 space-y-4">
              {/* Key Features List */}
              <div className="space-y-2.5">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-slate-800">
                  <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0 mt-0.5 shadow-xs">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Akses 1-Ketukan Tanpa Browser</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Buka dashboard langsung dari ikon beranda seperti aplikasi Android/iOS asli.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-800">
                  <div className="p-2 rounded-xl bg-scout-800 text-white shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Tampilan Penuh (Full Screen)</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Bebas dari bilah navigasi URL browser, tampilan absensi & administrasi lebih lega.
                    </p>
                  </div>
                </div>
              </div>

              {/* iOS Safari Guidance if on iPhone/iPad */}
              {isIos ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Share2 className="w-4 h-4 text-amber-700" />
                    <span>Cara Pasang di iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside pl-1">
                    <li>
                      Ketuk tombol <strong className="font-semibold text-slate-900">Bagikan (Share)</strong>{" "}
                      <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> di menu bawah Safari.
                    </li>
                    <li>
                      Gulir ke bawah dan pilih{" "}
                      <strong className="font-semibold text-slate-900">&quot;Tambah ke Layar Utama&quot;</strong>{" "}
                      <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.
                    </li>
                    <li>
                      Ketuk <strong className="font-semibold text-emerald-800">&quot;Tambah&quot;</strong> di sudut kanan atas.
                    </li>
                  </ol>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3 px-4 rounded-xl bg-scout-800 hover:bg-scout-700 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{isIos ? "Saya Mengerti Petunjuknya" : "Pasang Aplikasi Sekarang"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Nanti Saja
                </button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PWA Resmi Gugus Depan Maslahatul Hidayah • Aman & Hemat Memori</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
