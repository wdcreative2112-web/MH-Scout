import React from "react";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-md">
      {/* Ambient background glows */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none -top-10" />
      <div className="absolute w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -bottom-10" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Emblem & Rotating Rings */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/20 border-t-emerald-600 animate-spin" />
          {/* Inner pulsating glow ring */}
          <div className="absolute inset-1.5 rounded-2xl border border-amber-400/30 animate-pulse" />
          
          {/* Center Official Brand Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg shadow-emerald-950/15 border border-emerald-900/10 relative overflow-hidden">
            <img
              src="/logo.jpeg"
              alt="Logo Resmi Gerakan Pramuka Maslahatul Hidayah"
              className="w-full h-full object-contain rounded-xl animate-pulse"
            />
          </div>
        </div>

        {/* Text and animated status */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black tracking-tight text-scout-950">
              MH <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">SCOUT</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
            <p className="text-xs font-medium text-slate-500 tracking-wide">
              Menyiapkan halaman...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
