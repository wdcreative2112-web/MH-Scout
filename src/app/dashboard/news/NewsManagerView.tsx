"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createNewsAction,
  updateNewsAction,
  deleteNewsAction,
  updateNewsStatusAction,
} from "@/actions/content";
import { formatDate } from "@/lib/utils";
import {
  Newspaper,
  Plus,
  CheckCircle,
  Clock,
  Eye,
  X,
  Loader2,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface NewsManagerViewProps {
  initialNews: any[];
  categories: any[];
  canEdit: boolean;
}

export function NewsManagerView({ initialNews, categories, canEdit }: NewsManagerViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [deletingNews, setDeletingNews] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openCreateModal = () => {
    setEditingNews(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingNews(item);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingNews) {
        res = await updateNewsAction(editingNews.id, formData);
      } else {
        res = await createNewsAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan warta berita.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingNews(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingNews) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteNewsAction(deletingNews.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus warta berita.");
        setDeleteLoading(false);
      } else {
        setDeletingNews(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
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
            Penulisan, penerbitan, penyuntingan, dan pengarsipan berita resmi organisasi
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Berita Baru</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between group hover:border-slate-300 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {item.category?.name || "Umum"}
                  </span>
                  <div className="flex items-center gap-1.5">
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
                    {canEdit && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ubah Berita"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeletingNews(item);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Berita"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {item.coverImage && (
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <h3 className="font-bold text-base text-slate-900 leading-tight line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.summary}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`/berita/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-slate-700"
                    title="Lihat Pratinjau Publik"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {canEdit && (
                    <>
                      {item.status !== "TERBIT" && (
                        <button
                          type="button"
                          onClick={() => handleStatus(item.id, "TERBIT")}
                          className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-[11px] hover:bg-emerald-200"
                        >
                          Terbitkan
                        </button>
                      )}
                      {item.status === "TERBIT" && (
                        <button
                          type="button"
                          onClick={() => handleStatus(item.id, "ARSIP")}
                          className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-bold text-[11px] hover:bg-slate-200"
                        >
                          Arsipkan
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Belum ada warta berita.
        </div>
      )}

      {/* Modal Tulis / Ubah Berita */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingNews ? "Ubah Warta Berita" : "Tulis Berita Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingNews(null);
                }}
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form
              key={editingNews ? editingNews.id : "new"}
              onSubmit={handleSave}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Berita *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingNews?.title || ""}
                  placeholder="Judul warta aktual..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Kategori Berita</label>
                <select
                  name="categoryId"
                  defaultValue={editingNews?.categoryId || ""}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="">Umum (Tanpa Kategori)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ringkasan Singkat *</label>
                <textarea
                  name="summary"
                  required
                  rows={2}
                  defaultValue={editingNews?.summary || ""}
                  placeholder="Ringkasan 1-2 kalimat untuk kartu depan..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Isi Lengkap Berita *</label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  defaultValue={editingNews?.content || ""}
                  placeholder="Isi berita lengkap..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Foto Utama {editingNews?.coverImage && "(Biarkan kosong jika tidak diganti)"}
                </label>
                {editingNews?.coverImage && (
                  <div className="mb-2 w-24 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={editingNews.coverImage} alt="Cover saat ini" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  className="w-full text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status Publikasi</label>
                  <select
                    name="status"
                    defaultValue={editingNews?.status || "DRAF"}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  >
                    <option value="DRAF">Draf (Simpan Saja)</option>
                    <option value="TERBIT">Terbitkan Langsung ke Web</option>
                    <option value="ARSIP">Arsipkan</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingNews(null);
                  }}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingNews ? "Simpan Perubahan" : "Simpan Berita"}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Berita */}
      {deletingNews && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Warta Berita?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Berita <strong>{deletingNews.title}</strong> akan dihapus secara permanen dari portal. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNews(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus Berita</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
