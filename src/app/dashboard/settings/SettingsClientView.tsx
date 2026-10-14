"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrganizationProfileAction } from "@/actions/settings";
import { Settings, Save, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface SettingsClientViewProps {
  profile: any | null;
}

export function SettingsClientView({ profile }: SettingsClientViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateOrganizationProfileAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal menyimpan pengaturan.");
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Pengaturan Organisasi & Profil Pangkalan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Informasi ini digunakan pada halaman depan website publik dan kop laporan resmi
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan profil organisasi berhasil diperbarui!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="space-y-4">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
            Identitas Gugus Depan
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Gugus Depan *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={profile?.name || "Gugus Depan 01.001 - 01.002"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Nama Pangkalan *
              </label>
              <input
                type="text"
                name="pangkalan"
                required
                defaultValue={profile?.pangkalan || "Pangkalan SMA Negeri 1"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deskripsi Singkat Organisasi *
            </label>
            <textarea
              name="description"
              required
              rows={2}
              defaultValue={
                profile?.description ||
                "Organisasi kepanduan yang membentuk generasi muda berkarakter, tangguh, dan berakhlak mulia."
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Visi</label>
              <textarea
                name="vision"
                rows={3}
                defaultValue={profile?.vision || "Terwujudnya anggota Pramuka berkarakter unggul dan mandiri."}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Misi</label>
              <textarea
                name="mission"
                rows={3}
                defaultValue={profile?.mission || "1. Menyelenggarakan latihan rutin berkualitas.\n2. Mengamalkan Dasa Darma dan Tri Satya."}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sejarah Singkat</label>
            <textarea
              name="history"
              rows={3}
              defaultValue={profile?.history || "Berdiri sejak tahun 2010 sebagai wadah kepramukaan sekolah..."}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
            Kontak & Keuangan Awal
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Alamat Pangkalan</label>
              <input
                type="text"
                name="address"
                defaultValue={profile?.address || "Jl. Pramuka No. 1"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telepon / WA</label>
              <input
                type="text"
                name="phone"
                defaultValue={profile?.phone || "081234567890"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Resmi</label>
              <input
                type="email"
                name="email"
                defaultValue={profile?.email || "gudep@pramukaone.id"}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="w-full sm:w-1/2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Saldo Awal Pembukuan Kas (Rp) *
            </label>
            <input
              type="number"
              name="initialBalance"
              defaultValue={Number(profile?.initialBalance || 0)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Digunakan dalam rumus: Saldo Akhir = Saldo Awal + Total Pemasukan - Total Pengeluaran
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </form>
    </div>
  );
}
