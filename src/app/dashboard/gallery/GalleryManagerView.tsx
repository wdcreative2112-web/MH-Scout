"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createAlbumAction, addPhotoToAlbumAction } from "@/actions/gallery";
import { formatDate } from "@/lib/utils";
import { Image as ImageIcon, Plus, Upload, X, Loader2, Calendar } from "lucide-react";

interface GalleryManagerViewProps {
  initialAlbums: any[];
  canEdit: boolean;
}

export function GalleryManagerView({ initialAlbums, canEdit }: GalleryManagerViewProps) {
  const router = useRouter();
  const [albumModalOpen, setAlbumModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [targetAlbum, setTargetAlbum] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAlbum = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createAlbumAction(formData);
    setAlbumModalOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleUploadPhoto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetAlbum) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await addPhotoToAlbumAction(targetAlbum.id, formData);
    setPhotoModalOpen(false);
    setTargetAlbum(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Galeri Dokumentasi Foto
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan album dan publikasi foto kegiatan kepramukaan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setAlbumModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Album Baru</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialAlbums.map((album) => (
          <div
            key={album.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={album.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80"}
                  alt={album.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {album.photos?.length || 0} Foto
                </span>
              </div>

              <div className="p-5 space-y-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {formatDate(album.eventDate || album.createdAt)}
                </span>
                <h3 className="font-bold text-base text-slate-900 leading-tight">{album.title}</h3>
                {album.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{album.description}</p>
                )}
              </div>
            </div>

            {canEdit && (
              <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700">
                  {album.isPublished ? "Terbit di Web" : "Draf"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setTargetAlbum(album);
                    setPhotoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Foto</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Album */}
      {albumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Buat Album Dokumentasi</h3>
              <button type="button" onClick={() => setAlbumModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateAlbum} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Album *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Contoh: Gladian Pemimpin Regu (Dianpinru) 2024"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal Kegiatan</label>
                <input
                  type="date"
                  name="eventDate"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Deskripsi Singkat</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Penjelasan kegiatan yang didokumentasikan..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Foto Sampul</label>
                <input type="file" name="coverImage" accept="image/*" className="w-full text-slate-500" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isPublished"
                  name="isPublished"
                  value="true"
                  defaultChecked
                  className="rounded border-slate-300 text-emerald-600"
                />
                <label htmlFor="isPublished" className="font-bold text-slate-700">
                  Publikasikan Langsung ke Web
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAlbumModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">
                  {loading ? "Menyimpan..." : "Simpan Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Photo to Album */}
      {photoModalOpen && targetAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Unggah Foto ke {targetAlbum.title}</h3>
              <button type="button" onClick={() => setPhotoModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
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
                  className="w-full text-slate-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Keterangan / Kapsi</label>
                <input
                  type="text"
                  name="caption"
                  placeholder="Contoh: Adik-adik mendirikan tenda komando"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button type="submit" disabled={loading} className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">
                  {loading ? "Mengunggah..." : "Unggah Foto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
