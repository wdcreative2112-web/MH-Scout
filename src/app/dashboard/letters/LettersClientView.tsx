"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createLetterAction } from "@/actions/letters";
import { formatDate } from "@/lib/utils";
import { Mail, Plus, ArrowUpRight, ArrowDownLeft, X, Loader2, Search } from "lucide-react";

interface LettersClientViewProps {
  initialLetters: any[];
  canEdit: boolean;
}

export function LettersClientView({ initialLetters, canEdit }: LettersClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createLetterAction(formData);
    setModalOpen(false);
    setLoading(false);
    router.refresh();
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
            Pencatatan arsip surat masuk dan surat keluar resmi pangkalan
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              !typeFilter ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Semua ({initialLetters.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("MASUK")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              typeFilter === "MASUK" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Surat Masuk
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter("KELUAR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              typeFilter === "KELUAR" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            Surat Keluar
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari perihal atau nomor surat..."
            className="w-full pl-8 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4">Jenis</th>
                <th className="p-4">Nomor Surat</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Perihal</th>
                <th className="p-4">Pengirim / Penerima</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50/80">
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
                  <td className="p-4 font-bold text-slate-900">{l.subject}</td>
                  <td className="p-4 text-slate-600">{l.type === "MASUK" ? l.sender : l.recipient}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          Belum ada arsip surat.
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Catat Arsip Surat Baru</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Jenis Surat</label>
                  <select name="type" className="w-full p-2 border border-slate-300 rounded-xl bg-white">
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tanggal</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
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
                    placeholder="Kwarran / Pihak luar"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tujuan / Penerima</label>
                  <input
                    type="text"
                    name="recipient"
                    placeholder="Ka Gudep / Pembina"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ringkasan Isi</label>
                <textarea
                  name="summary"
                  rows={2}
                  placeholder="Ringkasan pokok isi surat..."
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
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">
                  Simpan Surat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
