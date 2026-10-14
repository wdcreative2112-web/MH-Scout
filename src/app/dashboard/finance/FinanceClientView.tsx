"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createTransactionAction,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  voidTransactionAction,
  deleteTransactionAction,
} from "@/actions/finance";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileText,
  Tag,
  Paperclip,
  X,
  Loader2,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";

interface FinanceClientViewProps {
  transactions: any[];
  categories: any[];
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  currentFilter: { type?: string; categoryId?: string; q?: string };
}

export function FinanceClientView({
  transactions,
  categories,
  initialBalance,
  totalIncome,
  totalExpense,
  currentBalance,
  currentFilter,
}: FinanceClientViewProps) {
  const router = useRouter();

  // Modals
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<"PEMASUKAN" | "PENGELUARAN">("PEMASUKAN");
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any | null>(null);
  const [deletingCat, setDeletingCat] = useState<any | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(currentFilter.q || "");

  const handleFilterChange = (key: string, val: string) => {
    const params = new URLSearchParams(window.location.search);
    if (val) params.set(key, val);
    else params.delete(key);
    router.push(`/dashboard/finance?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange("q", searchTerm);
  };

  const openNewTx = (type: "PEMASUKAN" | "PENGELUARAN") => {
    setTxType(type);
    setError(null);
    setTxModalOpen(true);
  };

  const handleTxSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.append("type", txType);

    try {
      const res = await createTransactionAction(formData);
      if (!res.success) {
        setError(res.error || "Gagal menyimpan transaksi.");
        setLoading(false);
      } else {
        setTxModalOpen(false);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleSaveCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingCat) {
        res = await updateCategoryAction(editingCat.id, formData);
      } else {
        res = await createCategoryAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan kategori.");
        setLoading(false);
      } else {
        setEditingCat(null);
        setShowCatForm(false);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deletingCat) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteCategoryAction(deletingCat.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus kategori.");
        setDeleteLoading(false);
      } else {
        setDeletingCat(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleVoidTx = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan transaksi ini? Transaksi yang dibatalkan tidak akan dihitung dalam saldo.")) return;
    await voidTransactionAction(id);
    router.refresh();
  };

  const handleDeleteTx = async () => {
    if (!deletingTx) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteTransactionAction(deletingTx.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus transaksi.");
        setDeleteLoading(false);
      } else {
        setDeletingTx(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === txType);

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pembukuan Kas & Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan arus kas, verifikasi kwitansi, dan saldo organisasi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              setCatModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori</span>
          </button>

          <button
            type="button"
            onClick={() => openNewTx("PEMASUKAN")}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>

          <button
            type="button"
            onClick={() => openNewTx("PENGELUARAN")}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Saldo KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Kas Bersih</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{formatRupiah(currentBalance)}</p>
          <p className="text-[11px] text-slate-400">Saldo Awal: {formatRupiah(initialBalance)}</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pemasukan</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">{formatRupiah(totalIncome)}</p>
          <p className="text-[11px] text-slate-400">Transaksi valid masuk</p>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-700">{formatRupiah(totalExpense)}</p>
          <p className="text-[11px] text-slate-400">Biaya operasional & kegiatan</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleFilterChange("type", "")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              !currentFilter.type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("type", "PEMASUKAN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentFilter.type === "PEMASUKAN"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange("type", "PENGELUARAN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              currentFilter.type === "PENGELUARAN"
                ? "bg-rose-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Pengeluaran
          </button>

          {/* Filter Category */}
          <select
            value={currentFilter.categoryId || ""}
            onChange={(e) => handleFilterChange("categoryId", e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari transaksi..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </form>
      </div>

      {/* Transaction List (Mobile Cards + Desktop Table) */}
      {transactions.length > 0 ? (
        <>
          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className={`bg-white p-4 rounded-2xl border ${
                  tx.status === "BATAL" ? "border-slate-200 opacity-60 bg-slate-50" : "border-slate-200"
                } shadow-2xs space-y-2.5`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(tx.date)}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{tx.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.category?.name || "Umum"}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        tx.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
                      }`}
                    >
                      {tx.type === "PEMASUKAN" ? "+" : "-"}
                      {formatRupiah(tx.amount)}
                    </span>
                    {tx.status === "BATAL" && (
                      <span className="block text-[10px] font-bold text-rose-600 uppercase">DIBATALKAN</span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Pencatat: {tx.createdBy?.name || "Admin"}</span>
                  <div className="flex items-center gap-2">
                    {tx.proofUrl && (
                      <button
                        type="button"
                        onClick={() => setProofPreviewUrl(tx.proofUrl)}
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        <span>Bukti</span>
                      </button>
                    )}
                    {tx.status === "VALID" && (
                      <button
                        type="button"
                        onClick={() => handleVoidTx(tx.id)}
                        className="text-amber-600 font-semibold"
                      >
                        Batalkan
                      </button>
                    )}
                    {tx.status === "BATAL" && (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setDeletingTx(tx);
                        }}
                        className="text-rose-600 font-semibold inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
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
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Judul Transaksi</th>
                  <th className="p-4">Kategori</th>
                  <th className="p-4">Sumber / Penerima</th>
                  <th className="p-4">Nominal</th>
                  <th className="p-4">Bukti</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      tx.status === "BATAL" ? "opacity-50 bg-slate-50/50" : ""
                    }`}
                  >
                    <td className="p-4 text-slate-600 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="p-4 font-bold text-slate-900">{tx.title}</td>
                    <td className="p-4 text-slate-700">{tx.category?.name || "-"}</td>
                    <td className="p-4 text-slate-600">{tx.sourceOrRecipient || "-"}</td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`font-black ${
                          tx.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {tx.type === "PEMASUKAN" ? "+" : "-"}
                        {formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setProofPreviewUrl(tx.proofUrl)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>Lihat</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.status === "VALID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {tx.status === "VALID" && (
                          <button
                            type="button"
                            onClick={() => handleVoidTx(tx.id)}
                            className="px-2.5 py-1 text-amber-700 hover:bg-amber-50 rounded-lg font-semibold"
                            title="Batalkan Transaksi (Void)"
                          >
                            Batalkan
                          </button>
                        )}
                        {tx.status === "BATAL" && (
                          <button
                            type="button"
                            onClick={() => {
                              setError(null);
                              setDeletingTx(tx);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Permanen Transaksi Batal"
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
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Tidak Ada Transaksi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada transaksi kas yang tercatat sesuai dengan filter yang dipilih.
          </p>
        </div>
      )}

      {/* MODAL: Tambah Transaksi */}
      {txModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                Catat Transaksi {txType === "PEMASUKAN" ? "Pemasukan (+)" : "Pengeluaran (-)"}
              </h3>
              <button
                type="button"
                onClick={() => setTxModalOpen(false)}
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

            <form onSubmit={handleTxSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Transaksi *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder={
                    txType === "PEMASUKAN"
                      ? "Contoh: Penerimaan Iuran Wajib Oktober"
                      : "Contoh: Pembelian Perlengkapan Tenda"
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Tanggal Transaksi *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Nominal (Rp) *
                  </label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="1"
                    placeholder="Contoh: 150000"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Kategori Transaksi *
                </label>
                <select
                  name="categoryId"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value="">Pilih Kategori</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {txType === "PEMASUKAN" ? "Sumber Dana / Pengirim" : "Penerima Dana / Toko"}
                </label>
                <input
                  type="text"
                  name="sourceOrRecipient"
                  placeholder="Nama orang, sekolah, atau toko"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Keterangan Tambahan
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Catatan rincian nota belanja atau keperluan..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Unggah Bukti Transaksi (Kwitansi / Nota / Struk)
                </label>
                <input
                  type="file"
                  name="proof"
                  accept="image/*"
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTxModalOpen(false)}
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
                  <span>Simpan Transaksi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kelola Kategori Kas */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Kelola Kategori Kas</h3>
                <p className="text-xs text-slate-500">Daftar kategori arus kas pemasukan dan pengeluaran</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCatModalOpen(false);
                  setShowCatForm(false);
                  setEditingCat(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                <span>{error}</span>
                <button type="button" onClick={() => setError(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {!showCatForm && !editingCat ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">
                    Kategori Terdaftar ({categories.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setShowCatForm(true);
                      setError(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Kategori</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  {categories.map((c) => (
                    <div key={c.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{c.name}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              c.type === "PEMASUKAN"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {c.type}
                          </span>
                        </div>
                        {c.description && <p className="text-[11px] text-slate-400 mt-0.5">{c.description}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCat(c);
                            setShowCatForm(true);
                            setError(null);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ubah Kategori"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeletingCat(c);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">Belum ada kategori.</div>
                  )}
                </div>
              </div>
            ) : (
              <form key={editingCat ? editingCat.id : "new"} onSubmit={handleSaveCat} className="space-y-4">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-800">
                    {editingCat ? "Ubah Data Kategori" : "Buat Kategori Baru"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setShowCatForm(false);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 underline"
                  >
                    Kembali ke daftar
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kategori *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={editingCat?.name || ""}
                    placeholder="Contoh: Dana BOS / Konsumsi Latihan"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipe Kategori *</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingCat?.type || "PEMASUKAN"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="PEMASUKAN">Pemasukan (+)</option>
                    <option value="PENGELUARAN">Pengeluaran (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keterangan</label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingCat?.description || ""}
                    placeholder="Deskripsi peruntukan kategori..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(null);
                      setShowCatForm(false);
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
                    <span>{editingCat ? "Simpan Perubahan" : "Simpan Kategori"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Kategori */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Kategori Kas?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus kategori <strong>{deletingCat.name}</strong>? Kategori yang sudah memiliki riwayat transaksi tidak dapat dihapus.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteCat}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Transaksi Permanen */}
      {deletingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Transaksi Permanen?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Transaksi <strong>{deletingTx.title}</strong> sebesar {formatRupiah(deletingTx.amount)} yang telah berstatus BATAL akan dihapus secara permanen dari basis data.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingTx(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleDeleteTx}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bukti Transaksi Lightbox */}
      {proofPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Bukti Kwitansi / Transaksi</h4>
              <button
                type="button"
                onClick={() => setProofPreviewUrl(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-50 flex items-center justify-center p-2">
              <img src={proofPreviewUrl} alt="Bukti transaksi" className="max-w-full h-auto rounded-lg shadow-xs" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
