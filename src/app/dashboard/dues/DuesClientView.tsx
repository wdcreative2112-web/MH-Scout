"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDuesTypeAction,
  updateDuesTypeAction,
  deleteDuesTypeAction,
  deleteMemberDuesAction,
  generateMemberDuesBillAction,
  payMemberDuesAction,
} from "@/actions/dues";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  Users,
  Search,
  Filter,
  X,
  Loader2,
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
} from "lucide-react";

interface DuesClientViewProps {
  duesTypes: any[];
  memberDuesList: any[];
  canEdit: boolean;
}

export function DuesClientView({ duesTypes, memberDuesList, canEdit }: DuesClientViewProps) {
  const router = useRouter();

  // Modals
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<any | null>(null);
  const [deletingType, setDeletingType] = useState<any | null>(null);
  const [deletingBill, setDeletingBill] = useState<any | null>(null);

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  const openAddType = () => {
    setEditingType(null);
    setError(null);
    setTypeModalOpen(true);
  };

  const openEditType = (type: any) => {
    setEditingType(type);
    setError(null);
    setTypeModalOpen(true);
  };

  const handleSaveType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingType) {
        res = await updateDuesTypeAction(editingType.id, formData);
      } else {
        res = await createDuesTypeAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan jenis iuran.");
        setLoading(false);
      } else {
        setTypeModalOpen(false);
        setEditingType(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deletingType) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteDuesTypeAction(deletingType.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus jenis iuran.");
        setDeleteLoading(false);
      } else {
        setDeletingType(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!deletingBill) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteMemberDuesAction(deletingBill.id);
      if (!res.success) {
        setError(res.error || "Gagal membatalkan tagihan iuran.");
        setDeleteLoading(false);
      } else {
        setDeletingBill(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleGenerateBills = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const duesTypeId = formData.get("duesTypeId") as string;
    const periodName = formData.get("periodName") as string;

    try {
      const res = await generateMemberDuesBillAction(duesTypeId, periodName);
      if (!res.success) {
        setError(res.error || "Gagal membuat tagihan massal.");
        setLoading(false);
      } else {
        alert(`Berhasil membuat ${res.count} tagihan iuran baru.`);
        setBillModalOpen(false);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingBill) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const amountPaid = parseFloat(formData.get("amountPaid") as string);
    const notes = formData.get("notes") as string;

    try {
      const res = await payMemberDuesAction(payingBill.id, amountPaid, notes);
      if (!res.success) {
        setError(res.error || "Gagal mencatat pembayaran.");
        setLoading(false);
      } else {
        setPayModalOpen(false);
        setPayingBill(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const filteredBills = memberDuesList.filter((b) => {
    let match = true;
    if (filterStatus && b.status !== filterStatus) match = false;
    if (search) {
      const q = search.toLowerCase();
      match =
        match &&
        (b.member?.fullName?.toLowerCase().includes(q) ||
          b.member?.memberNumber?.toLowerCase().includes(q) ||
          b.periodName?.toLowerCase().includes(q));
    }
    return match;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Iuran & Kewajiban Anggota
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Penetapan tagihan iuran kas, pencatatan setoran, dan rekap tunggakan
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAddType}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jenis Iuran</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setBillModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Buat Tagihan Periode</span>
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dues Types Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {duesTypes.map((dt) => (
          <div
            key={dt.id}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2 relative group hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {dt.period}
              </span>
              {canEdit && (
                <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEditType(dt)}
                    className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Ubah Jenis Iuran"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setDeletingType(dt);
                    }}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Jenis Iuran"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <h3 className="font-bold text-base text-slate-900 leading-tight">{dt.name}</h3>
            <p className="text-lg font-black text-slate-900">{formatRupiah(dt.amount)}</p>
            {dt.description && <p className="text-xs text-slate-500">{dt.description}</p>}
          </div>
        ))}
        {duesTypes.length === 0 && (
          <div className="sm:col-span-3 p-4 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-400">
            Belum ada jenis iuran yang didaftarkan.
          </div>
        )}
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              !filterStatus ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua Tagihan ({memberDuesList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("LUNAS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              filterStatus === "LUNAS"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Lunas
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("BELUM_LUNAS")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              filterStatus === "BELUM_LUNAS"
                ? "bg-amber-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Belum Lunas
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari anggota / periode..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {/* Bills List: Mobile Hybrid Cards + Desktop Table */}
      {filteredBills.length > 0 ? (
        <>
          {/* Mobile Cards (Visible on screens < sm) */}
          <div className="sm:hidden space-y-3">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header: Member Avatar + Name + Group + Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/50">
                      {bill.member?.fullName?.charAt(0) || "A"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {bill.member?.fullName || "Anggota"}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{bill.duesType?.name}</span>
                        {bill.member?.group && (
                          <>
                            <span>•</span>
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200/60">
                              {bill.member.group.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                      bill.status === "LUNAS"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>

                {/* Financial Details Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Periode</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{bill.periodName}</span>
                  </div>

                  <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 text-right">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Nominal Tagihan</span>
                    <span className="font-black text-slate-900 block mt-0.5">{formatRupiah(bill.amount)}</span>
                  </div>
                </div>

                {/* Payment Progress Bar / Status */}
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-600 font-semibold px-1">
                  <span>Terbayar: <strong className="text-emerald-700 font-black">{formatRupiah(bill.amountPaid)}</strong></span>
                  {bill.status !== "LUNAS" && (
                    <span className="text-amber-700 font-bold">
                      Sisa: {formatRupiah(Math.max(0, Number(bill.amount) - Number(bill.amountPaid)))}
                    </span>
                  )}
                </div>

                {/* Mobile Action Footer */}
                {canEdit && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {Number(bill.amountPaid) === 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setDeletingBill(bill);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {bill.status !== "LUNAS" ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPayingBill(bill);
                          setError(null);
                          setPayModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all ml-auto"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Bayar Sekarang</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-black inline-flex items-center gap-1 ml-auto">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lunas Terverifikasi
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Nama Anggota</th>
                  <th className="p-4">Regu</th>
                  <th className="p-4">Jenis Iuran</th>
                  <th className="p-4">Periode</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Dibayar</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{bill.member?.fullName}</td>
                    <td className="p-4 text-slate-600">{bill.member?.group?.name || "-"}</td>
                    <td className="p-4 text-slate-700 font-medium">{bill.duesType?.name}</td>
                    <td className="p-4 text-slate-600">{bill.periodName}</td>
                    <td className="p-4 font-bold text-slate-900">{formatRupiah(bill.amount)}</td>
                    <td className="p-4 font-semibold text-emerald-700">{formatRupiah(bill.amountPaid)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bill.status === "LUNAS"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canEdit && bill.status !== "LUNAS" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPayingBill(bill);
                              setError(null);
                              setPayModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                          >
                            Bayar
                          </button>
                        )}
                        {canEdit && Number(bill.amountPaid) === 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setDeletingBill(bill);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus / Batalkan Tagihan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Tidak Ada Tagihan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada tagihan iuran yang dibuat untuk periode ini.
          </p>
        </div>
      )}

      {/* MODAL: Tambah / Ubah Jenis Iuran */}
      {typeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingType ? "Ubah Jenis Iuran" : "Tambah Jenis Iuran Baru"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTypeModalOpen(false);
                  setEditingType(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form key={editingType ? editingType.id : "new"} onSubmit={handleSaveType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Iuran *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingType?.name || ""}
                  placeholder="Contoh: Iuran Kas Wajib Bulanan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1000"
                    defaultValue={editingType ? Number(editingType.amount) : 10000}
                    placeholder="10000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Periode *</label>
                  <select
                    name="period"
                    defaultValue={editingType?.period || "BULANAN"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="BULANAN">Bulanan</option>
                    <option value="INSIDENTAL">Insidental / Per Kegiatan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingType?.description || ""}
                  placeholder="Uraian peruntukan iuran..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setTypeModalOpen(false);
                    setEditingType(null);
                  }}
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
                  <span>{editingType ? "Simpan Perubahan" : "Simpan Jenis Iuran"}</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Buat Tagihan Periode Massal */}
      {billModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Buat Tagihan Iuran Massal</h3>
              <button
                type="button"
                onClick={() => setBillModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateBills} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pilih Jenis Iuran *</label>
                <select
                  name="duesTypeId"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  {duesTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      {dt.name} — {formatRupiah(dt.amount)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nama Periode Tagihan *
                </label>
                <input
                  type="text"
                  name="periodName"
                  required
                  defaultValue="Oktober 2024"
                  placeholder="Contoh: Oktober 2024 / Kemah Pelantikan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                Sistem akan membuat tagihan secara otomatis kepada seluruh anggota aktif yang belum memiliki tagihan pada periode tersebut.
              </p>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBillModalOpen(false)}
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
                  <span>Generate Tagihan</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bayar Iuran */}
      {payModalOpen && payingBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Catat Setoran Iuran</h3>
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{payingBill.member?.fullName}</p>
              <p className="text-slate-500">
                {payingBill.duesType?.name} • Periode: {payingBill.periodName}
              </p>
              <p className="text-slate-700 font-bold">
                Total Tagihan: {formatRupiah(payingBill.amount)} (Sudah Dibayar: {formatRupiah(payingBill.amountPaid)})
              </p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nominal Pembayaran Saat Ini (Rp) *
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  required
                  defaultValue={Number(payingBill.amount) - Number(payingBill.amountPaid)}
                  min="1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan Pembayaran</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="Lunas tunai ke bendahara"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
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
                  <span>Simpan Pembayaran</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Jenis Iuran */}
      {deletingType && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Jenis Iuran?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus <strong>{deletingType.name}</strong>? Jenis iuran yang sudah memiliki data tagihan anggota tidak dapat dihapus.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingType(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteType}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Tagihan */}
      {deletingBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Batalkan Tagihan Ini?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tagihan untuk <strong>{deletingBill.member?.fullName}</strong> ({deletingBill.duesType?.name} - {deletingBill.periodName}) sebesar {formatRupiah(deletingBill.amount)} akan dihapus permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBill(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleDeleteBill}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Batalkan Tagihan</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
