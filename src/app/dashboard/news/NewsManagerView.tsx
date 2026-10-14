"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewsAction, updateNewsStatusAction } from "@/actions/content";
import { formatDate } from "@/lib/utils";
import { Newspaper, Plus, CheckCircle, Clock, Eye, X, Loader2, Search } from "lucide-react";

interface NewsManagerViewProps {
  initialNews: any[];
  categories: any[];
  canEdit: boolean;
}

export function NewsManagerView({ initialNews, categories, canEdit }: NewsManagerViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createNewsAction(formData);
    setModalOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleStatus = async (id: string, st: "DRAF" | "TERBIT" | "ARSIP") => {
    await updateNewsStatusAction(id, st);
    router.refresh();
  };

  const filtered = initialNews.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Warta & Berita Kegiatan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penulisan, penerbitan, dan pengarsipan berita resmi organisasi
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Berita Baru</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul berita..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {item.category?.name || "Umum"}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      item.status === "TERBIT"
                        ? "bg-emerald-100 text-emerald-800"
                        : item.status === "DRAF"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-tight">{item.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</span>
                {canEdit && (
                  <div className="flex items-center gap-1.5">
                    {item.status !== "TERBIT" && (
                      <button
                        type="button"
                        onClick={() => handleStatus(item.id, "TERBIT")}
                        className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px]"
                      >
                        Terbitkan
                      </button>
                    )}
                    {item.status === "TERBIT" && (
                      <button
                        type="button"
                        onClick={() => handleStatus(item.id, "ARSIP")}
                        className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-[11px]"
                      >
                        Arsipkan
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Belum ada warta berita.
        </div>
      )}

      {/* Modal Tulis Berita */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Tulis Berita Baru</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Berita *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Judul warta aktual..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ringkasan Singkat *</label>
                <textarea
                  name="summary"
                  required
                  rows={2}
                  placeholder="Ringkasan 1-2 kalimat untuk kartu depan..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Isi Lengkap Berita *</label>
                <textarea
                  name="content"
                  required
                  rows={5}
                  placeholder="Isi berita lengkap..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Foto Utama</label>
                <input type="file" name="coverImage" accept="image/*" className="w-full text-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status Publikasi</label>
                  <select name="status" className="w-full p-2 border border-slate-300 rounded-xl bg-white">
                    <option value="DRAF">Draf (Simpan Saja)</option>
                    <option value="TERBIT">Terbitkan Langsung ke Web</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">
                  {loading ? "Menyimpan..." : "Simpan Berita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
