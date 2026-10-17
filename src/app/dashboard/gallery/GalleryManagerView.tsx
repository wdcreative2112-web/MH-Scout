"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createAlbumAction,
  updateAlbumAction,
  deleteAlbumAction,
  addPhotoToAlbumAction,
  deletePhotoAction,
} from "@/actions/gallery";
import { formatDate } from "@/lib/utils";
import {
  Image as ImageIcon,
  Plus,
  Upload,
  X,
  Loader2,
  Calendar,
  Edit2,
  Trash2,
  AlertCircle,
  ExternalLink,
  Images,
} from "lucide-react";

interface GalleryManagerViewProps {
  initialAlbums: any[];
  canEdit: boolean;
}

export function GalleryManagerView({ initialAlbums, canEdit }: GalleryManagerViewProps) {
  const router = useRouter();
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<any | null>(null);
  const [deletingAlbum, setDeletingAlbum] = useState<any | null>(null);

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [targetAlbum, setTargetAlbum] = useState<any | null>(null);

  const [viewPhotosAlbum, setViewPhotosAlbum] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCreateAlbum = () => {
    setEditingAlbum(null);
    setError(null);
    setAlbumModalOpen(true);
  };

  const openEditAlbum = (album: any) => {
    setEditingAlbum(album);
    setError(null);
    setAlbumModalOpen(true);
  };

  const handleSaveAlbum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingAlbum) {
        res = await updateAlbumAction(editingAlbum.id, formData);
      } else {
        res = await createAlbumAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan album.");
        setLoading(false);
      } else {
        setAlbumModalOpen(false);
        setEditingAlbum(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeleteAlbum = async () => {
    if (!deletingAlbum) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteAlbumAction(deletingAlbum.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus album.");
        setDeleteLoading(false);
      } else {
        setDeletingAlbum(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleUploadPhoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetAlbum) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await addPhotoToAlbumAction(targetAlbum.id, formData);
      if (!res.success) {
        setError(res.error || "Gagal mengunggah foto.");
        setLoading(false);
      } else {
        setPhotoModalOpen(false);
        setTargetAlbum(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Hapus foto ini dari album?")) return;
    setLoading(true);
    try {
      await deletePhotoAction(photoId);
      // update local viewPhotosAlbum if open
      if (viewPhotosAlbum) {
        setViewPhotosAlbum({
          ...viewPhotosAlbum,
          photos: viewPhotosAlbum.photos.filter((p: any) => p.id !== photoId),
        });
      }
      setLoading(false);
      router.refresh();
    } catch {
      alert("Gagal menghapus foto.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Galeri Dokumentasi Foto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan album, publikasi dokumentasi kegiatan, dan arsip foto kepramukaan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openCreateAlbum}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Album Baru</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialAlbums.map((album) => (
          <div
            key={album.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 flex flex-col justify-between group hover:border-slate-300 transition-colors"
          >
            <div>
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={
                    album.coverImage ||
                    "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80"
                  }
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={() => setViewPhotosAlbum(album)}
                  className="absolute bottom-2.5 right-2.5 bg-slate-900/80 hover:bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded inline-flex items-center gap-1 backdrop-blur-xs transition-colors"
                >
                  <Images className="w-3 h-3" />
                  <span>{album.photos?.length || 0} Foto</span>
                </button>
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{formatDate(album.eventDate || album.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <a
                      href={`/galeri/${album.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Lihat Pratinjau Publik"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditAlbum(album)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ubah Album"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeletingAlbum(album);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Album"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-tight">{album.title}</h3>
                {album.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{album.description}</p>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  album.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}
              >
                {album.isPublished ? "Terbit di Web" : "Draf"}
              </span>

              {canEdit && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewPhotosAlbum(album)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                  >
                    <span>Kelola Foto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetAlbum(album);
                      setPhotoModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {initialAlbums.length === 0 && (
          <div className="sm:col-span-3 p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
            Belum ada album dokumentasi yang dibuat.
          </div>
        )}
      </div>

      {/* Modal Buat / Ubah Album */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900">
                  {editingAlbum ? "Ubah Album Dokumentasi" : "Buat Album Dokumentasi"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setAlbumModalOpen(false);
                    setEditingAlbum(null);
                  }}
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
                </button>
              </div>

            <form
              key={editingAlbum ? editingAlbum.id : "new"}
              onSubmit={handleSaveAlbum}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Album *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingAlbum?.title || ""}
                  placeholder="Contoh: Gladian Pemimpin Regu (Dianpinru) 2024"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal Kegiatan</label>
                <input
                  type="date"
                  name="eventDate"
                  defaultValue={
                    editingAlbum?.eventDate
                      ? new Date(editingAlbum.eventDate).toISOString().split("T")[0]
                      : new Date().toISOString().split("T")[0]
                  }
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Deskripsi Singkat</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingAlbum?.description || ""}
                  placeholder="Penjelasan kegiatan yang didokumentasikan..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Foto Sampul {editingAlbum?.coverImage && "(Biarkan kosong jika tidak diubah)"}
                </label>
                {editingAlbum?.coverImage && (
                  <div className="mb-2 w-24 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={editingAlbum.coverImage} alt="Sampul saat ini" className="w-full h-full object-cover" />
                  </div>
                )}
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  className="w-full text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  value="true"
                  defaultChecked={editingAlbum ? editingAlbum.isPublished : true}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isPublished" className="font-bold text-slate-700 cursor-pointer">
                  Publikasikan Langsung ke Web
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAlbumModalOpen(false);
                    setEditingAlbum(null);
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
                  <span>{editingAlbum ? "Simpan Perubahan" : "Simpan Album"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Modal Upload Photo to Album */}
      {photoModalOpen && targetAlbum && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-base text-slate-900">Unggah Foto ke {targetAlbum.title}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalOpen(false);
                    setTargetAlbum(null);
                  }}
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
                </button>
              </div>
            <form onSubmit={handleUploadPhoto} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Pilih File Foto *</label>
                <input
                  type="file"
                  name="photo"
                  required
                  accept="image/*"
                  className="w-full text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 hover:file:bg-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Keterangan / Kapsi</label>
                <input
                  type="text"
                  name="caption"
                  placeholder="Contoh: Adik-adik mendirikan tenda komando"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoModalOpen(false);
                    setTargetAlbum(null);
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
                  <span>Unggah Foto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Modal Kelola Foto Album (Lihat & Hapus Foto) */}
      {viewPhotosAlbum && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Foto Album: {viewPhotosAlbum.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Total {viewPhotosAlbum.photos?.length || 0} foto dalam album ini
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewPhotosAlbum(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {viewPhotosAlbum.photos && viewPhotosAlbum.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {viewPhotosAlbum.photos.map((photo: any) => (
                  <div
                    key={photo.id}
                    className="relative group rounded-xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || "Foto album"}
                      className="w-full h-full object-cover"
                    />
                    {photo.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white text-[10px] line-clamp-2">
                        {photo.caption}
                      </div>
                    )}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity shadow-xs hover:bg-rose-700"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                Belum ada foto yang diunggah ke album ini.
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetAlbum(viewPhotosAlbum);
                    setPhotoModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tambah Foto Baru</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewPhotosAlbum(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 ml-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Modal Konfirmasi Hapus Album */}
      {deletingAlbum && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Hapus Album Dokumentasi?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Album <strong>{deletingAlbum.title}</strong> beserta seluruh {deletingAlbum.photos?.length || 0} foto di dalamnya akan dihapus permanen.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingAlbum(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAlbum}
                  disabled={deleteLoading}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Hapus Album</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
