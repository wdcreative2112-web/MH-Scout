"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createArticleAction,
  updateArticleAction,
  deleteArticleAction,
  updateArticleStatusAction,
} from "@/actions/content";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  X,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface ArticleManagerViewProps {
  initialArticles: any[];
  categories?: any[];
  canEdit: boolean;
}

export function ArticleManagerView({
  initialArticles,
  categories = [],
  canEdit,
}: ArticleManagerViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [deletingArticle, setDeletingArticle] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const openCreateModal = () => {
    setEditingArticle(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingArticle(item);
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
      if (editingArticle) {
        res = await updateArticleAction(editingArticle.id, formData);
      } else {
        res = await createArticleAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan artikel materi.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingArticle(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingArticle) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteArticleAction(deletingArticle.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus artikel materi.");
        setDeleteLoading(false);
      } else {
        setDeletingArticle(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleStatus = async (id: string, st: "DRAF" | "TERBIT" | "ARSIP") => {
    await updateArticleStatusAction(id, st);
    router.refresh();
  };

  const filtered = initialArticles.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kelola Materi & Artikel Edukasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Materi tali temali, sandi, kepemimpinan, dan wawasan kepramukaan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Artikel Baru</span>
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
            placeholder="Cari materi..."
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
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                    {item.category?.name || "Materi Pandu"}
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
                          title="Ubah Artikel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeletingArticle(item);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Artikel"
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
                    href={`/artikel/${item.slug}`}
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
          Belum ada artikel materi.
        </div>
      )}

      {/* Modal Tulis / Ubah Artikel */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingArticle ? "Ubah Materi Artikel" : "Tulis Artikel Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingArticle(null);
                }}
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form
              key={editingArticle ? editingArticle.id : "new"}
              onSubmit={handleSave}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Artikel *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingArticle?.title || ""}
                  placeholder="Contoh: Mengenal Sandi Morse dan Semaphore..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {categories.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Kategori Artikel</label>
                  <select
                    name="categoryId"
                    defaultValue={editingArticle?.categoryId || ""}
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
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ringkasan Singkat *</label>
                <textarea
                  name="summary"
                  required
                  rows={2}
                  defaultValue={editingArticle?.summary || ""}
                  placeholder="Ringkasan materi 1-2 kalimat..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Isi Lengkap Artikel *</label>
                <textarea
                  name="content"
                  required
                  rows={6}
                  defaultValue={editingArticle?.content || ""}
                  placeholder="Isi materi artikel lengkap..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-sans"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Foto / Ilustrasi Cover {editingArticle?.coverImage && "(Biarkan kosong jika tidak diganti)"}
                </label>
                {editingArticle?.coverImage && (
                  <div className="mb-2 w-24 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={editingArticle.coverImage} alt="Cover saat ini" className="w-full h-full object-cover" />
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
                    defaultValue={editingArticle?.status || "DRAF"}
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
                    setEditingArticle(null);
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
                  <span>{editingArticle ? "Simpan Perubahan" : "Simpan Artikel"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Artikel */}
      {deletingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Artikel Materi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Artikel <strong>{deletingArticle.title}</strong> akan dihapus secara permanen dari materi belajar.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingArticle(null)}
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
                <span>Hapus Artikel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
