"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, toggleUserStatusAction } from "@/actions/users";
import { formatDate } from "@/lib/utils";
import { UserCog, Plus, Shield, CheckCircle, XCircle, X, Loader2, AlertCircle } from "lucide-react";

interface UsersClientViewProps {
  initialUsers: any[];
  groups?: any[];
  currentUserId: string;
}

export function UsersClientView({ initialUsers, groups = [], currentUserId }: UsersClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("SEKRETARIS");
  const [loading, setLoading] = useState(false);
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

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
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
                  {user.id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(user.id)}
                      className={`px-2.5 py-1 rounded font-semibold text-[11px] ${
                        user.isActive
                          ? "text-rose-600 hover:bg-rose-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px]">(Akun Anda)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL: Tambah Pengguna */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
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
                  placeholder="petugas@pramukaone.id"
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
                  defaultValue="PramukaOne123!"
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
                  className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl"
                >
                  {loading ? "Menyimpan..." : "Buat Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
