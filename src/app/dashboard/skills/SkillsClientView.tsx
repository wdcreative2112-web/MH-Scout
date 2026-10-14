"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createSkillRequirementAction, updateMemberSkillProgressAction } from "@/actions/skills";
import { formatDate } from "@/lib/utils";
import { BookOpen, Plus, Award, CheckCircle, Clock, X, Loader2, User, Search } from "lucide-react";

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
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);

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

  const handleCreateReq = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    await createSkillRequirementAction(formData);
    setModalOpen(false);
    setLoading(false);
    router.refresh();
  };

  const handleUpdateTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMemberId || !selectedReq) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as "BELUM" | "PROSES" | "LULUS";
    const examinerName = formData.get("examinerName") as string;
    const notes = formData.get("notes") as string;

    await updateMemberSkillProgressAction({
      memberId: selectedMemberId,
      requirementId: selectedReq.id,
      status,
      examinerName,
      notes,
    });

    setTestModalOpen(false);
    setSelectedReq(null);
    setLoading(false);
    router.refresh();
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
            Pengelolaan butir syarat kecakapan umum dan pencatatan pengujian anggota
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("REQUIREMENTS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "REQUIREMENTS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Materi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PROGRESS")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "PROGRESS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Uji Anggota
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Butir Syarat</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "REQUIREMENTS" ? (
        /* TAB 1: DAFTAR MATERI */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {req.type} • {req.golongan}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-400">No. {req.number}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{req.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{req.description}</p>
              </div>
              {req.level && <span className="text-[11px] text-slate-400 font-medium">Tingkat: {req.level}</span>}
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
              className="w-full sm:w-80 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
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

      {/* MODAL: Tambah Butir Syarat */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Tambah Butir Syarat Kecakapan</h3>
              <button type="button" onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateReq} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tipe</label>
                  <select name="type" className="w-full p-2 border border-slate-300 rounded-xl bg-white">
                    <option value="SKU">SKU (Umum)</option>
                    <option value="SKK">SKK (Khusus)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Golongan</label>
                  <select name="golongan" className="w-full p-2 border border-slate-300 rounded-xl bg-white">
                    <option value="Penggalang">Penggalang</option>
                    <option value="Penegak">Penegak</option>
                    <option value="Siaga">Siaga</option>
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
                    defaultValue={requirements.length + 1}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Tingkat</label>
                  <input
                    type="text"
                    name="level"
                    placeholder="Ramu / Rakit / Terap"
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Judul Materi *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="Contoh: Menguasai Kompas & Peta Pita"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Rincian Persyaratan *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Detail yang harus dipraktikkan anggota..."
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Uji Anggota */}
      {testModalOpen && selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">Uji Syarat Kecakapan</h3>
              <button type="button" onClick={() => setTestModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
              <p className="font-bold text-slate-900">{selectedReq.title}</p>
              <p className="text-slate-500">{selectedReq.description}</p>
            </div>
            <form onSubmit={handleUpdateTest} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Hasil Pengujian *</label>
                <select name="status" className="w-full p-2 border border-slate-300 rounded-xl bg-white">
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
                  placeholder="Kak Pembina Satuan"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Catatan Pengujian</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Catatan nilai atau aspek yang perlu ditingkatkan..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-xl">
                  Simpan Hasil Uji
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
