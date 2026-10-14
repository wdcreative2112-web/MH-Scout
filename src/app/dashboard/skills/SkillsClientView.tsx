"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSkillRequirementAction,
  updateSkillRequirementAction,
  deleteSkillRequirementAction,
  updateMemberSkillProgressAction,
} from "@/actions/skills";
import { formatDate } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Award,
  CheckCircle,
  Clock,
  X,
  Loader2,
  User,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface SkillsClientViewProps {
  requirements: any[];
  members: any[];
  memberProgress: any[];
  selectedMemberId: string;
  canEdit: boolean;
}

export function SkillsClientView({
  requirements,
  members,
  memberProgress,
  selectedMemberId,
  canEdit,
}: SkillsClientViewProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"REQUIREMENTS" | "PROGRESS">("REQUIREMENTS");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<any | null>(null);
  const [deletingReq, setDeletingReq] = useState<any | null>(null);

  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map progress: requirementId -> progress record
  const progressMap = React.useMemo(() => {
    const map: Record<string, any> = {};
    memberProgress.forEach((p) => {
      map[p.requirementId] = p;
    });
    return map;
  }, [memberProgress]);

  const handleSelectMember = (mId: string) => {
    router.push(`/dashboard/skills?memberId=${mId}`);
    setActiveTab("PROGRESS");
  };

  const openCreateReq = () => {
    setEditingReq(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditReq = (req: any) => {
    setEditingReq(req);
    setError(null);
    setModalOpen(true);
  };

  const handleSaveReq = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingReq) {
        res = await updateSkillRequirementAction(editingReq.id, formData);
      } else {
        res = await createSkillRequirementAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan syarat kecakapan.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingReq(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDeleteReq = async () => {
    if (!deletingReq) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteSkillRequirementAction(deletingReq.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus butir syarat.");
        setDeleteLoading(false);
      } else {
        setDeletingReq(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const handleUpdateTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedReq) return;
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as "BELUM" | "PROSES" | "LULUS";
    const examinerName = formData.get("examinerName") as string;
    const notes = formData.get("notes") as string;

    try {
      const res = await updateMemberSkillProgressAction({
        memberId: selectedMemberId,
        requirementId: selectedReq.id,
        status,
        examinerName,
        notes,
      });

      if (!res.success) {
        setError(res.error || "Gagal memperbarui hasil uji.");
        setLoading(false);
      } else {
        setTestModalOpen(false);
        setSelectedReq(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kecakapan Pramuka (SKU & SKK)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan materi syarat kecakapan umum/khusus dan rekap pengujian anggota
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("REQUIREMENTS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "REQUIREMENTS"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Materi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PROGRESS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "PROGRESS"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Uji Anggota
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openCreateReq}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Syarat</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === "REQUIREMENTS" ? (
        /* TAB 1: DAFTAR MATERI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {req.type} • {req.golongan}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-slate-400">No. {req.number}</span>
                    {canEdit && (
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => openEditReq(req)}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Ubah Butir Syarat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setDeletingReq(req);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Butir Syarat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <h3 className="font-bold text-sm text-slate-900 leading-snug">{req.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{req.description}</p>
              </div>
              {req.level && (
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
                  Tingkat: <span className="font-semibold text-slate-700">{req.level}</span>
                </div>
              )}
            </div>
          ))}
          {requirements.length === 0 && (
            <div className="col-span-3 p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
              Belum ada butir materi SKU/SKK yang ditambahkan.
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: UJI ANGGOTA */
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
              Pilih Anggota:
            </span>
            <select
              value={selectedMemberId}
              onChange={(e) => handleSelectMember(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
            >
              <option value="">(Pilih Anggota Pramuka)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} ({m.memberNumber}) — {m.scoutLevel}
                </option>
              ))}
            </select>
          </div>

          {selectedMember ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{selectedMember.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    {selectedMember.memberNumber} • {selectedMember.scoutLevel} • {selectedMember.group?.name || "-"}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {Object.values(progressMap).filter((p) => p.status === "LULUS").length} / {requirements.length} Lulus
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {requirements.map((req) => {
                  const prog = progressMap[req.id];
                  const st = prog?.status || "BELUM";

                  return (
                    <div
                      key={req.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">#{req.number}</span>
                          <span className="font-bold text-sm text-slate-900">{req.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{req.description}</p>
                        {prog?.examinerName && (
                          <p className="text-[11px] text-slate-400">
                            Penguji: {prog.examinerName} {prog.testedAt && `• ${formatDate(prog.testedAt)}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                            st === "LULUS"
                              ? "bg-emerald-100 text-emerald-800"
                              : st === "PROSES"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {st}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReq(req);
                              setTestModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg"
                          >
                            Uji
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
              Silakan pilih anggota terlebih dahulu untuk melihat dan menguji kecakapan.
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Ubah Butir Syarat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingReq ? "Ubah Butir Syarat Kecakapan" : "Tambah Butir Syarat Kecakapan"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingReq(null);
                }}
              >
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>

            <form
              key={editingReq ? editingReq.id : "new"}
              onSubmit={handleSaveReq}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipe</label>
                  <select
                    name="type"
                    defaultValue={editingReq?.type || "SKU"}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="SKU">SKU (Umum)</option>
                    <option value="SKK">SKK (Khusus)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Golongan</label>
                  <select
                    name="golongan"
                    defaultValue={editingReq?.golongan || "Penggalang"}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="Penggalang">Penggalang</option>
                    <option value="Penegak">Penegak</option>
                    <option value="Siaga">Siaga</option>
                    <option value="Pandega">Pandega</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">No. Urut *</label>
                  <input
                    type="number"
                    name="number"
                    required
                    min="1"
                    defaultValue={editingReq ? editingReq.number : requirements.length + 1}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tingkat</label>
                  <input
                    type="text"
                    name="level"
                    defaultValue={editingReq?.level || ""}
                    placeholder="Ramu / Rakit / Terap"
                    className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Materi *</label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingReq?.title || ""}
                  placeholder="Contoh: Menguasai Kompas & Peta Pita"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Rincian Persyaratan *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  defaultValue={editingReq?.description || ""}
                  placeholder="Detail yang harus dipraktikkan anggota..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingReq(null);
                  }}
                  className="px-3 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingReq ? "Simpan Perubahan" : "Simpan Materi"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Uji Anggota */}
      {testModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Uji Syarat Kecakapan</h3>
              <button type="button" onClick={() => setTestModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-700" />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedReq.title}</p>
              <p className="text-slate-500">{selectedReq.description}</p>
            </div>
            <form onSubmit={handleUpdateTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Hasil Pengujian *</label>
                <select
                  name="status"
                  defaultValue={progressMap[selectedReq.id]?.status || "LULUS"}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="LULUS">Lulus (Selesai Diuji)</option>
                  <option value="PROSES">Dalam Proses Pengujian</option>
                  <option value="BELUM">Belum Lulus</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Nama Pembina Penguji</label>
                <input
                  type="text"
                  name="examinerName"
                  defaultValue={progressMap[selectedReq.id]?.examinerName || ""}
                  placeholder="Kak Pembina Satuan"
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Catatan Pengujian</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={progressMap[selectedReq.id]?.notes || ""}
                  placeholder="Catatan nilai atau aspek yang perlu ditingkatkan..."
                  className="w-full p-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Hasil Uji</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Butir Syarat */}
      {deletingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Butir Syarat?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Syarat <strong>{deletingReq.type} #{deletingReq.number} - {deletingReq.title}</strong> beserta riwayat kelulusan anggota terkait akan dihapus permanen.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingReq(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteReq}
                disabled={deleteLoading}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus Syarat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
