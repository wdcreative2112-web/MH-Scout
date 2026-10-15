"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      const result = await loginAction(formData);

      if (!result.success) {
        setError(result.error || "Gagal masuk. Periksa kembali email dan password.");
        setLoading(false);
      } else if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan atau server.");
      setLoading(false);
    }
  };

  const setDemoAccount = (roleEmail: string, rolePass: string) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Return to home link */}
      <div className="max-w-md w-full mx-auto mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-scout-800 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda Publik</span>
        </Link>
      </div>

      <div className="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Header */}
        <div className="bg-gradient-to-r from-scout-950 via-scout-900 to-scout-800 p-6 sm:p-8 text-white text-center">
          {/* Official Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-black/30 border border-white/20 overflow-hidden">
            <img
              src="/logo.jpeg"
              alt="Logo Resmi Gerakan Pramuka Maslahatul Hidayah"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Portal Petugas MH SCOUT</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Masuk untuk mengakses dashboard administrasi, absensi, dan keuangan
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Pengguna
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mhscout.id"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-scout-600 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-scout-600 focus:border-transparent transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-scout-800 text-white font-bold text-sm shadow-md hover:bg-scout-700 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Preset Demo Accounts */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Pilihan Akun Demo (Klik untuk Isi Cepat):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("admin@mhscout.id", "AdminPramuka123!")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("sekretaris@mhscout.id", "Sekretaris123!")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                Sekretaris
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("bendahara@mhscout.id", "Bendahara123!")}
                className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                Bendahara
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 leading-tight">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Sistem satu pangkalan. Akun baru hanya dapat dibuat oleh Admin melalui modul manajemen pengguna.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
