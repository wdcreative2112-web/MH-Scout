"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createLeaderAction, updateLeaderAction } from "@/actions/leaders";
import { Award, Plus, Edit2, Phone, Mail, X, Loader2, AlertCircle } from "lucide-react";

interface LeadersClientViewProps {
  initialLeaders: any[];
  canEdit: boolean;
}

export function LeadersClientView({ initialLeaders, canEdit }: LeadersClientViewProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => {
    setEditingLeader(null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (l: any) => {
    setEditingLeader(l);
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
      if (editingLeader) {
        res = await updateLeaderAction(editingLeader.id, formData);
      } else {
        res = await createLeaderAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan pembina.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingLeader(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Pembina Satuan Pramuka
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data Majelis Pembimbing Gugus Depan dan Pembina Satuan Putra/Putri
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pembina Baru</span>
          </button>
        )}
      </div>

      {initialLeaders.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {initialLeaders.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center shrink-0">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-slate-900 leading-tight">{lead.name}</h2>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">{lead.position}</p>
                    {lead.nip && <p className="text-[11px] text-slate-400 font-mono">NTA: {lead.nip}</p>}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  {lead.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{lead.email}</span>
                    </div>
                  )}
                  {lead.groups && lead.groups.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Regu Dampingan:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {lead.groups.map((g: any) => (
                          <span
                            key={g.id}
                            className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-700"
                          >
                            {g.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="pt-3 border-t border-slate-100 text-right">
                  <button
                    type="button"
                    onClick={() => openEdit(lead)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Ubah Pembina</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-800">Belum Ada Pembina</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Data pembina satuan belum didaftarkan ke sistem.
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingLeader ? "Ubah Data Pembina" : "Tambah Pembina Baru"}
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Pembina *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingLeader?.name || ""}
                  placeholder="Contoh: Kak Budi Santoso, S.Pd"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NTA / NIP</label>
                  <input
                    type="text"
                    name="nip"
                    defaultValue={editingLeader?.nip || ""}
                    placeholder="01.001.001"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Gender</label>
                  <select
                    name="gender"
                    defaultValue={editingLeader?.gender || "L"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jabatan Pembina *</label>
                <input
                  type="text"
                  name="position"
                  required
                  defaultValue={editingLeader?.position || "Pembina Satuan"}
                  placeholder="Contoh: Ka Gudep / Pembina Satuan Penggalang"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">No. HP / WhatsApp</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingLeader?.phone || ""}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingLeader?.email || ""}
                    placeholder="nama@email.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
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
                  <span>{editingLeader ? "Simpan Perubahan" : "Tambah Pembina"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
