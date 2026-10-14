"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createLetterAction, updateLetterAction, deleteLetterAction } from "@/actions/letters";
import { formatDate } from "@/lib/utils";
import {
  Mail,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";

interface LettersClientViewProps {
  initialLetters: any[];
  canEdit: boolean;
}

export function LettersClientView({ initialLetters, canEdit }: LettersClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<any | null>(null);
  const [detailLetter, setDetailLetter] = useState<any | null>(null);
  const [deletingLetter, setDeletingLetter] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const openAdd = () => {
    setEditingLetter(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (letter: any) => {
    setEditingLetter(letter);
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
      if (editingLetter) {
        res = await updateLetterAction(editingLetter.id, formData);
      } else {
        res = await createLetterAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan data surat.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingLetter(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLetter) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteLetterAction(deletingLetter.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus surat.");
        setDeleteLoading(false);
      } else {
        setDeletingLetter(null);
        setDetailLetter(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const filtered = initialLetters.filter((l) => {
    let match = true;
    if (typeFilter && l.type !== typeFilter) match = false;
    if (search) {
      const q = search.toLowerCase();
      match =
        match &&
        (l.subject.toLowerCase().includes(q) ||
          l.letterNumber.toLowerCase().includes(q) ||
          (l.sender && l.sender.toLowerCase().includes(q)) ||
          (l.recipient && l.recipient.toLowerCase().includes(q)));
    }
    return match;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrasi Surat Gugus Depan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pencatatan arsip surat masuk dan surat keluar resmi pangkalan ({initialLetters.length} dokumen tercatat)
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Surat Baru</span>
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !typeFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua ({initialLetters.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("MASUK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === "MASUK" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Surat Masuk
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("KELUAR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              typeFilter === "KELUAR" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Surat Keluar
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari perihal, nomor, atau pengirim..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <>
          {/* Mobile Cards (Visible on screens < sm) */}
          <div className="sm:hidden space-y-3">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
              >
                {/* Header: Type Badge (Masuk / Keluar) + Letter Number + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        l.type === "MASUK" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {l.type === "MASUK" ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      <span>{l.type}</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-700 truncate">
                      {l.letterNumber}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      l.status === "DIKIRIM" || l.status === "DITERIMA"
                        ? "bg-emerald-100 text-emerald-800"
                        : l.status === "DIARSIPKAN"
                        ? "bg-slate-100 text-slate-600"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {l.status}
                  </span>
                </div>

                {/* Perihal & Metadata */}
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                    {l.subject}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span>{formatDate(l.date)}</span>
                    <span>•</span>
                    <span className="truncate">
                      {l.type === "MASUK" ? `Dari: ${l.sender || "-"}` : `Tujuan: ${l.recipient || "-"}`}
                    </span>
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setDetailLetter(l)}
                    className="font-bold text-emerald-700 hover:text-emerald-800 py-1"
                  >
                    Detail Lengkap
                  </button>

                  <div className="flex items-center gap-2">
                    {l.fileUrl && (
                      <a
                        href={l.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Unduh Lampiran"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEdit(l)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Ubah Surat"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingLetter(l);
                            setError(null);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Hapus Surat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
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
                  <th className="p-4">Jenis</th>
                  <th className="p-4">Nomor Surat</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Perihal</th>
                  <th className="p-4">Pengirim / Penerima</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          l.type === "MASUK" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {l.type === "MASUK" ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        <span>{l.type}</span>
                      </span>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">{l.letterNumber}</td>
                    <td className="p-4 text-slate-600">{formatDate(l.date)}</td>
                    <td className="p-4 font-bold text-slate-900 max-w-xs truncate">{l.subject}</td>
                    <td className="p-4 text-slate-600">{l.type === "MASUK" ? l.sender || "-" : l.recipient || "-"}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          l.status === "DIKIRIM" || l.status === "DITERIMA"
                            ? "bg-emerald-100 text-emerald-800"
                            : l.status === "DIARSIPKAN"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailLetter(l)}
                          className="px-2 py-1 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 font-semibold"
                        >
                          Detail
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(l)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Ubah Surat"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingLetter(l);
                                setError(null);
                              }}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                              title="Hapus Surat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
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
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 text-sm">Belum ada arsip surat.</p>
          <p className="text-slate-400 text-xs mt-0.5">Catat surat masuk atau buat surat keluar baru untuk pangkalan.</p>
        </div>
      )}

      {/* MODAL: Tambah / Ubah Surat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingLetter ? "Ubah Data Surat" : "Catat Arsip Surat Baru"}
              </h3>
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

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Jenis Surat *</label>
                  <select
                    name="type"
                    defaultValue={editingLetter?.type || "MASUK"}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold"
                  >
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={
                      editingLetter?.date
                        ? new Date(editingLetter.date).toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nomor Surat *</label>
                <input
                  type="text"
                  name="letterNumber"
                  required
                  defaultValue={editingLetter?.letterNumber || ""}
                  placeholder="001/PRAMUKA/X/2024"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Perihal Surat *</label>
                <input
                  type="text"
                  name="subject"
                  required
                  defaultValue={editingLetter?.subject || ""}
                  placeholder="Undangan Lomba Tingkat / Izin Kegiatan"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Pengirim</label>
                  <input
                    type="text"
                    name="sender"
                    defaultValue={editingLetter?.sender || ""}
                    placeholder="Kwarran / Pihak luar"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tujuan / Penerima</label>
                  <input
                    type="text"
                    name="recipient"
                    defaultValue={editingLetter?.recipient || ""}
                    placeholder="Ka Gudep / Pembina"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Status Surat</label>
                <select
                  name="status"
                  defaultValue={editingLetter?.status || "DRAF"}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white font-semibold"
                >
                  <option value="DRAF">DRAF</option>
                  <option value="DIKIRIM">DIKIRIM</option>
                  <option value="DITERIMA">DITERIMA</option>
                  <option value="DIARSIPKAN">DIARSIPKAN</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ringkasan Isi</label>
                <textarea
                  name="summary"
                  rows={2}
                  defaultValue={editingLetter?.summary || ""}
                  placeholder="Ringkasan pokok isi surat..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingLetter?.notes || ""}
                  placeholder="Lokasi fisik arsip / keterangan..."
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
                  <span>{editingLetter ? "Simpan Perubahan" : "Simpan Surat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Detail Surat */}
      {detailLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    detailLetter.type === "MASUK" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {detailLetter.type === "MASUK" ? "SURAT MASUK" : "SURAT KELUAR"}
                </span>
                <span className="font-mono text-xs text-slate-600 font-bold">{detailLetter.letterNumber}</span>
              </div>
              <button type="button" onClick={() => setDetailLetter(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Perihal</span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">{detailLetter.subject}</h4>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tanggal Surat</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formatDate(detailLetter.date)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailLetter.status}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pengirim</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailLetter.sender || "-"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Penerima / Tujuan</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{detailLetter.recipient || "-"}</p>
                </div>
              </div>

              {detailLetter.summary && (
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Ringkasan Isi Surat</span>
                  <p className="text-slate-700 leading-relaxed mt-1">{detailLetter.summary}</p>
                </div>
              )}

              {detailLetter.notes && (
                <div className="p-3 border border-slate-100 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Catatan Arsip</span>
                  <p className="text-slate-600 mt-0.5">{detailLetter.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const letter = detailLetter;
                      setDetailLetter(null);
                      openEdit(letter);
                    }}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Surat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const letter = detailLetter;
                      setDetailLetter(null);
                      setDeletingLetter(letter);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setDetailLetter(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Surat */}
      {deletingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Arsip Surat?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus arsip surat <span className="font-bold text-slate-800">{deletingLetter.letterNumber}</span> ({deletingLetter.subject})? Tindakan ini tidak dapat dibatalkan.
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
                onClick={() => setDeletingLetter(null)}
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
                <span>{deleteLoading ? "Menghapus..." : "Ya, Hapus Surat"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
