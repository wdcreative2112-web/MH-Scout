"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createMemberAction, updateMemberAction, toggleMemberStatusAction } from "@/actions/members";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Shield,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

const SCOUT_LEVELS = [
  "Siaga Mula",
  "Siaga Bantu",
  "Siaga Tata",
  "Penggalang Ramu",
  "Penggalang Rakit",
  "Penggalang Terap",
  "Penegak Bantara",
  "Penegak Laksana",
  "Pandega",
];

interface MembersClientViewProps {
  initialMembers: any[];
  groups: any[];
  canEdit: boolean;
  currentFilter: { q?: string; regu?: string; tingkatan?: string; status?: string };
}

export function MembersClientView({
  initialMembers,
  groups,
  canEdit,
  currentFilter,
}: MembersClientViewProps) {
  const router = useRouter();

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [detailMember, setDetailMember] = useState<any | null>(null);

  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchTerm, setSearchTerm] = useState(currentFilter.q || "");

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(window.location.search);
    if (val) params.set(key, val);
    else params.delete(key);
    router.push(`/dashboard/members?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("q", searchTerm);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (member: any) => {
    setEditingMember(member);
    setError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      let res;
      if (editingMember) {
        res = await updateMemberAction(editingMember.id, formData);
      } else {
        res = await createMemberAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan data.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingMember(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "AKTIF" ? "NONAKTIF" : "AKTIF";
    if (!confirm(`Ubah status anggota ini menjadi ${nextStatus}?`)) return;
    await toggleMemberStatusAction(id, nextStatus as "AKTIF" | "NONAKTIF");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header and Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Manajemen Data Anggota
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Total {initialMembers.length} anggota terdaftar dalam pangkalan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Anggota Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau NTA..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Filter Regu */}
          <div>
            <select
              value={currentFilter.regu || ""}
              onChange={(e) => handleFilterChange("regu", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              <option value="">Semua Regu</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tingkatan */}
          <div>
            <select
              value={currentFilter.tingkatan || ""}
              onChange={(e) => handleFilterChange("tingkatan", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              <option value="">Semua Tingkatan</option>
              {SCOUT_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={currentFilter.status || ""}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
            >
              <option value="">Semua Status</option>
              <option value="AKTIF">Hanya Aktif</option>
              <option value="NONAKTIF">Nonaktif</option>
              <option value="ALUMNI">Alumni</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members List (Mobile Cards + Desktop Table) */}
      {initialMembers.length > 0 ? (
        <>
          {/* Mobile Cards (Visible on small screens) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
            {initialMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                      {member.fullName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-sm text-slate-900 leading-tight">{member.fullName}</h2>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{member.memberNumber}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.status === "AKTIF"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tingkatan</span>
                    <span className="font-semibold text-slate-800">{member.scoutLevel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Regu</span>
                    <span className="font-semibold text-slate-800">{member.group?.name || "-"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setDetailMember(member)}
                    className="font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    Detail Lengkap
                  </button>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(member.id, member.status)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-rose-600"
                      >
                        {member.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (Hidden on small screens) */}
          <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">No. Anggota</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Gender</th>
                  <th className="p-4">Tingkatan</th>
                  <th className="p-4">Regu</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-medium text-slate-600">{member.memberNumber}</td>
                    <td className="p-4 font-bold text-slate-900">{member.fullName}</td>
                    <td className="p-4 text-slate-600">{member.gender === "L" ? "Putra" : "Putri"}</td>
                    <td className="p-4 font-semibold text-slate-800">{member.scoutLevel}</td>
                    <td className="p-4 text-slate-700">{member.group?.name || "-"}</td>
                    <td className="p-4 text-slate-600">{member.classGrade || "-"}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          member.status === "AKTIF"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setDetailMember(member)}
                        className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 font-semibold"
                      >
                        Detail
                      </button>
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member.id, member.status)}
                            className="px-2.5 py-1 text-rose-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 font-semibold"
                          >
                            {member.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Tidak Ada Data Anggota</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada anggota yang terdaftar sesuai dengan kriteria pencarian atau filter yang dipilih.
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={openAddModal}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              Tambah Anggota Pertama
            </button>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Edit Anggota */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingMember ? "Edit Data Anggota" : "Tambah Anggota Baru"}
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nomor Anggota / NTA *
                  </label>
                  <input
                    type="text"
                    name="memberNumber"
                    required
                    defaultValue={editingMember?.memberNumber || ""}
                    placeholder="Contoh: PRM-001"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    name="gender"
                    required
                    defaultValue={editingMember?.gender || "L"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="L">Laki-laki (Putra)</option>
                    <option value="P">Perempuan (Putri)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Lengkap Anggota *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  defaultValue={editingMember?.fullName || ""}
                  placeholder="Nama lengkap sesuai data resmi"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tingkatan Pramuka *
                  </label>
                  <select
                    name="scoutLevel"
                    required
                    defaultValue={editingMember?.scoutLevel || "Penggalang Ramu"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    {SCOUT_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Regu / Sangga
                  </label>
                  <select
                    name="groupId"
                    defaultValue={editingMember?.groupId || ""}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="">(Belum ada regu)</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Kelas / Tingkat Sekolah
                  </label>
                  <input
                    type="text"
                    name="classGrade"
                    defaultValue={editingMember?.classGrade || ""}
                    placeholder="Contoh: VII-A / X IPA 1"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Status Keanggotaan
                  </label>
                  <select
                    name="status"
                    defaultValue={editingMember?.status || "AKTIF"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="AKTIF">Aktif</option>
                    <option value="NONAKTIF">Nonaktif</option>
                    <option value="ALUMNI">Alumni</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Telepon / WA Anggota
                  </label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingMember?.phone || ""}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    No. Kontak Orang Tua / Wali
                  </label>
                  <input
                    type="text"
                    name="parentPhone"
                    defaultValue={editingMember?.parentPhone || ""}
                    placeholder="0813xxxxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Catatan Administratif
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingMember?.notes || ""}
                  placeholder="Riwayat kesehatan khusus, prestasi, dll."
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
                  <span>{editingMember ? "Simpan Perubahan" : "Tambah Anggota"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Anggota */}
      {detailMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Kartu Data Anggota</h3>
              <button
                type="button"
                onClick={() => setDetailMember(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center">
                  {detailMember.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{detailMember.fullName}</h4>
                  <p className="text-slate-500 font-mono text-[11px]">{detailMember.memberNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tingkatan</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{detailMember.scoutLevel}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Regu / Sangga</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{detailMember.group?.name || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Jenis Kelamin</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    {detailMember.gender === "L" ? "Laki-laki" : "Perempuan"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Kelas</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{detailMember.classGrade || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Telepon Anggota</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{detailMember.phone || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Kontak Orang Tua</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">{detailMember.parentPhone || "-"}</p>
                </div>
              </div>

              {detailMember.notes && (
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Catatan Khusus</span>
                  <p className="text-slate-700 text-xs mt-1">{detailMember.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setDetailMember(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Tutup Kartu Anggota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
