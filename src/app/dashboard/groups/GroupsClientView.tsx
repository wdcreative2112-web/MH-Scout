"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction, updateGroupAction, deleteGroupAction } from "@/actions/groups";
import { Shield, Plus, Edit2, Trash2, Users, User, X, Loader2, AlertCircle } from "lucide-react";

interface GroupsClientViewProps {
  initialGroups: any[];
  leaders: any[];
  canEdit: boolean;
}

export function GroupsClientView({ initialGroups, leaders, canEdit }: GroupsClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingGroup(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (g: any) => {
    setEditingGroup(g);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      let res;
      if (editingGroup) {
        res = await updateGroupAction(editingGroup.id, formData);
      } else {
        res = await createGroupAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan regu.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingGroup(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteGroupAction(deletingGroup.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus regu.");
        setDeleteLoading(false);
      } else {
        setDeletingGroup(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Regu & Sangga Pramuka
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelompokan regu penggalang, sangga penegak, serta pembina pendamping
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Regu Baru</span>
          </button>
        )}
      </div>

      {initialGroups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {initialGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5 text-amber-700" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {group.category}
                  </span>
                </div>

                <div>
                  <h2 className="font-bold text-lg text-slate-900 leading-tight">{group.name}</h2>
                  {group.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{group.description}</p>
                  )}
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      <span>Anggota Aktif</span>
                    </span>
                    <span className="font-bold text-slate-900">{group._count?.members || 0} orang</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <User className="w-3.5 h-3.5" />
                      <span>Pembina</span>
                    </span>
                    <span className="font-semibold text-slate-800">{group.leader?.name || "-"}</span>
                  </div>
                </div>
              </div>

              {canEdit && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(group)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Regu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingGroup(group);
                      setError(null);
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                    title="Hapus Regu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Belum Ada Regu</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Silakan buat regu pertama untuk mengelompokkan adik-adik pramuka.
          </p>
        </div>
      )}

      {/* Modal Add / Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGroup ? "Ubah Data Regu" : "Tambah Regu Baru"}
              </h3>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Regu / Sangga *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingGroup?.name || ""}
                  placeholder="Contoh: Regu Rajawali / Sangga Perintis"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kategori / Golongan *</label>
                <select
                  name="category"
                  required
                  defaultValue={editingGroup?.category || "Penggalang Putra"}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="Penggalang Putra">Penggalang Putra</option>
                  <option value="Penggalang Putri">Penggalang Putri</option>
                  <option value="Penegak Putra">Penegak Putra</option>
                  <option value="Penegak Putri">Penegak Putri</option>
                  <option value="Siaga Putra">Siaga Putra</option>
                  <option value="Siaga Putri">Siaga Putri</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pembina Pendamping</label>
                <select
                  name="leaderId"
                  defaultValue={editingGroup?.leaderId || ""}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="">(Belum ditentukan)</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.position})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan Tambahan</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingGroup?.description || ""}
                  placeholder="Motto regu, ciri khas, dll."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
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
                  <span>{editingGroup ? "Simpan Perubahan" : "Tambah Regu"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Regu */}
      {deletingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Data Regu?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus <span className="font-bold text-slate-800">{deletingGroup.name}</span> ({deletingGroup.category})? Anggota di regu ini akan dilepaskan status regunya (tidak terhapus).
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingGroup(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteGroup}
                disabled={deleteLoading}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? "Menghapus..." : "Ya, Hapus Regu"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
