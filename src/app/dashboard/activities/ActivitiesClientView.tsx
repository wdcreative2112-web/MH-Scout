"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createActivityAction, updateActivityStatusAction } from "@/actions/activities";
import { formatDate } from "@/lib/utils";
import { Calendar, Plus, Clock, MapPin, CheckCircle, XCircle, X, Loader2, AlertCircle } from "lucide-react";

interface ActivitiesClientViewProps {
  initialActivities: any[];
  canEdit: boolean;
}

export function ActivitiesClientView({ initialActivities, canEdit }: ActivitiesClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await createActivityAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal membuat kegiatan.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    await updateActivityStatusAction(id, nextStatus);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Kegiatan Pramuka
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Daftar latihan rutin, perkemahan, lomba, dan agenda pangkalan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Agenda Kegiatan</span>
          </button>
        )}
      </div>

      {initialActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {initialActivities.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {act.category}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      act.status === "SELESAI"
                        ? "bg-slate-100 text-slate-600"
                        : act.status === "BERJALAN"
                        ? "bg-emerald-100 text-emerald-800"
                        : act.status === "DIBATALKAN"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {act.status}
                  </span>
                </div>

                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 leading-tight">{act.title}</h2>
                  {act.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mulai: {formatDate(act.startDate)}</span>
                  </div>
                  {act.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                    <span>{act.isPublic ? "Publik (Tampil di Web)" : "Internal Pangkalan"}</span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Ubah Status:</span>
                  <div className="flex items-center gap-1.5">
                    {act.status !== "SELESAI" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(act.id, "SELESAI")}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                      >
                        Selesai
                      </button>
                    )}
                    {act.status !== "DIBATALKAN" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(act.id, "DIBATALKAN")}
                        className="px-2.5 py-1 rounded bg-slate-100 hover:bg-rose-50 text-[11px] font-semibold text-rose-600"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Belum Ada Agenda Kegiatan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Buat rencana kegiatan latihan, kemah, atau lomba untuk pangkalan.
          </p>
        </div>
      )}

      {/* Modal Add Activity */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Buat Agenda Kegiatan Baru</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kegiatan *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Contoh: Perkemahan Sabtu Minggu (Persami)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori *</label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="Latihan Rutin">Latihan Rutin</option>
                    <option value="Perkemahan">Perkemahan</option>
                    <option value="Lomba">Lomba / Prestasi</option>
                    <option value="Pelantikan">Pelantikan</option>
                    <option value="Bakti Sosial">Bakti Sosial</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Awal</label>
                  <select
                    name="status"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="TERJADWAL">Terjadwal</option>
                    <option value="BERJALAN">Sedang Berjalan</option>
                    <option value="SELESAI">Selesai</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Mulai *</label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lokasi Kegiatan</label>
                <input
                  type="text"
                  name="location"
                  placeholder="Contoh: Bumi Perkemahan Cibubur / Lapangan Sekolah"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Deskripsi Kegiatan</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Penjelasan detail tujuan dan susunan kegiatan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublic"
                  name="isPublic"
                  value="true"
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="isPublic" className="text-xs font-semibold text-slate-700">
                  Tampilkan di Website Publik (Jadwal Kegiatan Mendatang)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Agenda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
