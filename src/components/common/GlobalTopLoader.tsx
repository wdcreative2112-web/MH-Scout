"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function TopLoaderInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Selesai loading saat rute berganti
  useEffect(() => {
    if (visible) {
      setProgress(100);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      finishTimerRef.current = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const startLoading = () => {
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setProgress(15);
    setVisible(true);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 90;
        }
        // Simulasi progres yang melambat mendekati 90%
        const diff = Math.max(1, (90 - prev) * 0.15);
        return prev + diff;
      });
    }, 120);
  };

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Abaikan target _blank, download, hash anchor (#), mailto, tel, javascript:
      if (
        target.target === "_blank" ||
        target.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:")
      ) {
        return;
      }

      // Pastikan tautan internal dengan origin yang sama
      try {
        const url = new URL(href, window.location.href);
        if (url.origin === window.location.origin) {
          // Jangan tampilkan jika menuju halaman dan query yang persis sama
          if (url.pathname === window.location.pathname && url.search === window.location.search) {
            return;
          }
          startLoading();
        }
      } catch {
        // Abaikan URL tidak valid
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (timerRef.current) clearInterval(timerRef.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-[99999] pointer-events-none transition-opacity duration-300 ${
        progress === 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Garis Progres Utama */}
      <div
        className="h-[3px] bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300 transition-all ease-out"
        style={{
          width: `${progress}%`,
          transitionDuration: progress === 100 ? "200ms" : "300ms",
          boxShadow: "0 0 14px rgba(16, 185, 129, 0.8), 0 0 6px rgba(245, 158, 11, 0.6)",
        }}
      />

      {/* Indikator Titik Pijar (Glowing Head) */}
      <div
        className="absolute top-0 right-0 h-[3px] w-24 bg-gradient-to-l from-white via-amber-200 to-transparent blur-[1px]"
        style={{
          transform: `translateX(-${100 - progress}%)`,
          display: progress >= 95 ? "none" : "block",
        }}
      />

      {/* Mini Spinner di Sudut Kanan Atas */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-5">
        <div className="w-4 h-4 rounded-full border-2 border-emerald-500/30 border-t-emerald-600 animate-spin shadow-sm" />
      </div>
    </div>
  );
}

export function GlobalTopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderInner />
    </Suspense>
  );
}
