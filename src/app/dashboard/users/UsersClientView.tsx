"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserAction, deleteUserAction, toggleUserStatusAction } from "@/actions/users";
import { formatDate } from "@/lib/utils";
import { UserCog, Plus, Shield, CheckCircle, XCircle, X, Loader2, AlertCircle, Edit2, Trash2, KeyRound } from "lucide-react";

interface UsersClientViewProps {
  initialUsers: any[];
  groups?: any[];
  currentUserId: string;
}

export function UsersClientView({ initialUsers, groups = [], currentUserId }: UsersClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState("SEKRETARIS");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createUserAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal membuat akun.");
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

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateUserAction(editingUser.id, formData);
      if (!res.success) {
        setError(res.error || "Gagal memperbarui akun.");
        setLoading(false);
      } else {
        setEditingUser(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteUserAction(deletingUser.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus pengguna.");
        setDeleteLoading(false);
      } else {
        setDeletingUser(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleToggle = async (userId: string) => {
    const res = await toggleUserStatusAction(userId);
    if (!res.success) {
      alert(res.error || "Gagal mengubah status.");
    } else {
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Akun Pengguna
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Hak akses petugas sistem: Admin, Sekretaris, dan Bendahara
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Mobile Cards (Visible on screens < sm) */}
      <div className="sm:hidden space-y-3">
        {initialUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
          >
            {/* Header: Avatar + Name + Role Badge */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200/50">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {user.name}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-end gap-1">
                {user.role === "ADMIN" && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                    ADMIN
                  </span>
                )}
                {user.role === "SEKRETARIS" && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    SEKRETARIS
                  </span>
                )}
                {user.role === "BENDAHARA" && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    BENDAHARA
                  </span>
                )}
                {user.role === "KETUA_REGU" && (
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                    KETUA REGU
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>

            {/* Info Grid: Phone & Assigned Regu */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">No. WhatsApp/HP</span>
                <span className="font-mono font-semibold text-slate-800 mt-0.5 block">{user.phone || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Gugus / Regu</span>
                <span className="font-semibold text-slate-800 mt-0.5 block truncate">{user.group?.name || "-"}</span>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(user);
                  setSelectedRole(user.role);
                  setError(null);
                }}
                className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1.5 py-1"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Data</span>
              </button>

              <div className="flex items-center gap-2">
                {user.id !== currentUserId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggle(user.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors ${
                        user.isActive
                          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }`}
                    >
                      {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingUser(user);
                        setError(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="text-slate-400 text-[11px] font-medium ml-1">(Akun Anda)</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4">Nama Petugas</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role Akses</th>
              <th className="p-4">No. HP</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-900 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <span>{user.name}</span>
                </td>
                <td className="p-4 text-slate-600 font-mono text-[11px]">{user.email}</td>
                <td className="p-4">
                  {user.role === "ADMIN" && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800">
                      ADMIN
                    </span>
                  )}
                  {user.role === "SEKRETARIS" && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800">
                      SEKRETARIS
                    </span>
                  )}
                  {user.role === "BENDAHARA" && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      BENDAHARA
                    </span>
                  )}
                  {user.role === "KETUA_REGU" && (
                    <div className="flex flex-col gap-1 items-start">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        KETUA REGU
                      </span>
                      {user.group && (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {user.group.name}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="p-4 text-slate-500">{user.phone || "-"}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      user.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUser(user);
                        setSelectedRole(user.role);
                        setError(null);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Ubah Data Akun"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {user.id !== currentUserId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggle(user.id)}
                          className={`px-2 py-1 rounded font-semibold text-[11px] ${
                            user.isActive
                              ? "text-slate-600 hover:bg-slate-100"
                              : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                          title={user.isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                        >
                          {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingUser(user);
                            setError(null);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-medium ml-1">(Akun Anda)</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Tambah Pengguna */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Tambah Akun Petugas Baru</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Nama petugas..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="petugas@mhscout.id"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Role / Wewenang *</label>
                <select
                  name="role"
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="SEKRETARIS">Sekretaris (Administrasi, Absensi, Publikasi)</option>
                  <option value="BENDAHARA">Bendahara (Kas, Iuran, Keuangan)</option>
                  <option value="KETUA_REGU">Ketua Regu (PINRU - Absensi Anggota Regunya)</option>
                  <option value="ADMIN">Admin (Akses Penuh Seluruh Modul)</option>
                </select>
              </div>

              {selectedRole === "KETUA_REGU" && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Pilih Regu yang Dipimpin *
                  </label>
                  <select
                    name="groupId"
                    required
                    className="w-full p-2 border border-amber-300 rounded-xl bg-amber-50/50 font-semibold text-slate-900"
                  >
                    <option value="">-- Pilih Regu / Sangga --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ketua Regu hanya dapat melihat dan melakukan absensi untuk anggota regu ini.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Password Awal *</label>
                <input
                  type="password"
                  name="password"
                  required
                  defaultValue="MhScout123!"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="0812xxxxxxxx"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Menyimpan..." : "Buat Akun"}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ubah / Edit Pengguna */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Ubah Data Akun Petugas</h3>
              <button type="button" onClick={() => setEditingUser(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingUser.name}
                  placeholder="Nama petugas..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={editingUser.email}
                  placeholder="petugas@mhscout.id"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Role / Wewenang *</label>
                <select
                  name="role"
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="SEKRETARIS">Sekretaris (Administrasi, Absensi, Publikasi)</option>
                  <option value="BENDAHARA">Bendahara (Kas, Iuran, Keuangan)</option>
                  <option value="KETUA_REGU">Ketua Regu (PINRU - Absensi Anggota Regunya)</option>
                  <option value="ADMIN">Admin (Akses Penuh Seluruh Modul)</option>
                </select>
              </div>

              {selectedRole === "KETUA_REGU" && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">
                    Pilih Regu yang Dipimpin *
                  </label>
                  <select
                    name="groupId"
                    required
                    defaultValue={editingUser.groupId || ""}
                    className="w-full p-2 border border-amber-300 rounded-xl bg-amber-50/50 font-semibold text-slate-900"
                  >
                    <option value="">-- Pilih Regu / Sangga --</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Reset Password (Opsional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Kosongkan jika tidak diubah</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Masukkan password baru jika ingin mereset..."
                    className="w-full p-2 pl-8 border border-slate-300 rounded-xl"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={editingUser.phone || ""}
                  placeholder="0812xxxxxxxx"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Pengguna */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Akun Pengguna?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-slate-800">{deletingUser.name}</span> ({deletingUser.email})? Tindakan ini tidak dapat dibatalkan.
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
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleteLoading ? "Menghapus..." : "Ya, Hapus Akun"}</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
