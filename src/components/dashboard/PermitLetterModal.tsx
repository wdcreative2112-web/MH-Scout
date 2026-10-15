"use client";

import React, { useState, useEffect } from "react";
import {
  PermitLetterData,
  generatePermitLetterNumber,
} from "@/lib/permit-letter";
import { createPermitLetterAction, updatePermitLetterAction } from "@/actions/letters";
import { PermitLetterTemplate } from "./PermitLetterTemplate";
import {
  X,
  Loader2,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Building,
  CheckCircle2,
  Eye,
  PenTool,
} from "lucide-react";

interface PermitLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (letter: any) => void;
  initialData?: PermitLetterData | null;
  members: any[];
  activities: any[];
  leaders: any[];
  organizationProfile?: any;
  existingCount: number;
}

export function PermitLetterModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  members,
  activities,
  leaders,
  organizationProfile,
  existingCount,
}: PermitLetterModalProps) {
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [letterNumber, setLetterNumber] = useState(
    initialData?.letterNumber || generatePermitLetterNumber(existingCount)
  );
  const [date, setDate] = useState(
    initialData?.date || new Date().toISOString().split("T")[0]
  );
  const [selectedMemberId, setSelectedMemberId] = useState(
    initialData?.memberId || ""
  );
  const [memberName, setMemberName] = useState(initialData?.memberName || "");
  const [memberNumber, setMemberNumber] = useState(
    initialData?.memberNumber || ""
  );
  const [groupName, setGroupName] = useState(initialData?.groupName || "");
  const [scoutLevel, setScoutLevel] = useState(
    initialData?.scoutLevel || "Penggalang"
  );
  const [classGrade, setClassGrade] = useState(initialData?.classGrade || "");

  const [selectedActivityId, setSelectedActivityId] = useState(
    initialData?.activityId || ""
  );
  const [activityTitle, setActivityTitle] = useState(
    initialData?.activityTitle || "Latihan Mingguan Pramuka"
  );
  const [permitType, setPermitType] = useState<"SAKIT" | "IZIN">(
    initialData?.permitType || "SAKIT"
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate || new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate || new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState(
    initialData?.reason ||
      "Sakit demam dan disarankan dokter untuk istirahat pemulihan."
  );

  const [parentName, setParentName] = useState(
    initialData?.parentName || "Orang Tua / Wali Murid"
  );
  const [parentPhone, setParentPhone] = useState(
    initialData?.parentPhone || ""
  );

  const defaultLeader = leaders[0];
  const [leaderName, setLeaderName] = useState(
    initialData?.leaderName || defaultLeader?.name || "Pembina Satuan"
  );
  const [leaderNip, setLeaderNip] = useState(
    initialData?.leaderNip || defaultLeader?.nip || "-"
  );
  const [createdPlace, setCreatedPlace] = useState(
    initialData?.createdPlace || "Jakarta"
  );

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setLetterNumber(initialData.letterNumber);
      setDate(initialData.date);
      setSelectedMemberId(initialData.memberId || "");
      setMemberName(initialData.memberName);
      setMemberNumber(initialData.memberNumber);
      setGroupName(initialData.groupName);
      setScoutLevel(initialData.scoutLevel);
      setClassGrade(initialData.classGrade || "");
      setSelectedActivityId(initialData.activityId || "");
      setActivityTitle(initialData.activityTitle);
      setPermitType(initialData.permitType);
      setStartDate(initialData.startDate);
      setEndDate(initialData.endDate);
      setReason(initialData.reason);
      setParentName(initialData.parentName);
      setParentPhone(initialData.parentPhone || "");
      setLeaderName(initialData.leaderName);
      setLeaderNip(initialData.leaderNip || "-");
      setCreatedPlace(initialData.createdPlace || "Jakarta");
    } else {
      setLetterNumber(generatePermitLetterNumber(existingCount));
    }
  }, [initialData, existingCount]);

  if (!isOpen) return null;

  // Handle member selection and auto-fill
  const handleMemberSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const memId = e.target.value;
    setSelectedMemberId(memId);
    if (!memId) return;

    const found = members.find((m) => m.id === memId);
    if (found) {
      setMemberName(found.fullName);
      setMemberNumber(found.memberNumber || "-");
      setGroupName(found.group?.name || "-");
      setScoutLevel(found.scoutLevel || "Penggalang");
      setClassGrade(found.classGrade || "");
      if (found.parentPhone) {
        setParentPhone(found.parentPhone);
      }
    }
  };

  // Handle activity selection and auto-fill
  const handleActivitySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const actId = e.target.value;
    setSelectedActivityId(actId);
    if (!actId) return;

    const found = activities.find((a) => a.id === actId);
    if (found) {
      setActivityTitle(found.title);
      if (found.startDate) {
        const s = new Date(found.startDate).toISOString().split("T")[0];
        setStartDate(s);
        setEndDate(
          found.endDate
            ? new Date(found.endDate).toISOString().split("T")[0]
            : s
        );
      }
    }
  };

  // Handle leader selection
  const handleLeaderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lName = e.target.value;
    setLeaderName(lName);
    const found = leaders.find((l) => l.name === lName);
    if (found) {
      setLeaderNip(found.nip || "-");
    }
  };

  const currentPreviewData: PermitLetterData = {
    id: initialData?.id,
    letterNumber,
    date,
    memberId: selectedMemberId,
    memberName: memberName || "Nama Anggota",
    memberNumber: memberNumber || "-",
    groupName: groupName || "-",
    scoutLevel: scoutLevel || "Penggalang",
    classGrade,
    activityId: selectedActivityId,
    activityTitle: activityTitle || "Kegiatan Pramuka",
    permitType,
    startDate,
    endDate,
    reason,
    parentName: parentName || "Orang Tua / Wali",
    parentPhone,
    leaderName: leaderName || "Pembina Satuan",
    leaderNip,
    createdPlace: createdPlace || "Jakarta",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("letterNumber", letterNumber);
    formData.append("date", date);
    formData.append("memberId", selectedMemberId);
    formData.append("memberName", memberName);
    formData.append("memberNumber", memberNumber);
    formData.append("groupName", groupName);
    formData.append("scoutLevel", scoutLevel);
    formData.append("classGrade", classGrade);
    formData.append("activityId", selectedActivityId);
    formData.append("activityTitle", activityTitle);
    formData.append("permitType", permitType);
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("reason", reason);
    formData.append("parentName", parentName);
    formData.append("parentPhone", parentPhone);
    formData.append("leaderName", leaderName);
    formData.append("leaderNip", leaderNip);
    formData.append("createdPlace", createdPlace);

    try {
      let res;
      if (initialData?.id) {
        res = await updatePermitLetterAction(initialData.id, formData);
      } else {
        res = await createPermitLetterAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan surat izin.");
        setLoading(false);
      } else {
        setLoading(false);
        onSuccess(res.data);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white sm:rounded-3xl shadow-2xl border-x sm:border border-slate-100 my-0 sm:my-8 overflow-hidden flex flex-col min-h-screen sm:min-h-0">
        {/* ========================================================= */}
        {/* MODAL HEADER - RESPONSIVE & CLEAN */}
        {/* ========================================================= */}
        <div className="sticky top-0 z-30 bg-slate-950 text-white px-4 py-3 sm:px-6 sm:py-4 shadow-md border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            {/* Title & Icon */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm sm:text-base text-white leading-tight truncate">
                  {initialData ? "Ubah Surat Izin Anggota" : "Buat Surat Izin Anggota"}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">
                  Format resmi izin sakit / berhalangan hadir kegiatan
                </p>
              </div>
            </div>

            {/* Desktop Tabs & Close Button */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Desktop Tabs */}
              <div className="hidden sm:flex bg-slate-900 p-1 rounded-xl text-xs font-semibold border border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "form"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Formulir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Surat</span>
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher Row */}
          <div className="sm:hidden grid grid-cols-2 gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "form"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Formulir Isian</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "preview"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Surat</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL BODY */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "preview" ? (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
                <span>
                  💡 Pratinjau tampilan surat resmi sesuai data yang sedang Anda isi.
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab("form")}
                  className="font-bold underline text-emerald-900 shrink-0 cursor-pointer"
                >
                  Edit Data
                </button>
              </div>
              <PermitLetterTemplate
                data={currentPreviewData}
                organization={organizationProfile}
                showActions={false}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
              <div className="p-4 sm:p-6 space-y-5 flex-1 text-xs sm:text-sm">
                {/* SECTION 1: METADATA SURAT */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                    1. Informasi Dokumen Surat
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nomor Surat Izin *
                      </label>
                      <input
                        type="text"
                        required
                        value={letterNumber}
                        onChange={(e) => setLetterNumber(e.target.value)}
                        placeholder="001/GUD-MH/IZIN/X/2026"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tanggal Surat *
                      </label>
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Kota Penerbitan Surat
                      </label>
                      <input
                        type="text"
                        value={createdPlace}
                        onChange={(e) => setCreatedPlace(e.target.value)}
                        placeholder="Jakarta"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: DATA ANGGOTA */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                      2. Data Anggota yang Izin
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Pilih dari database atau ketik manual
                    </span>
                  </div>

                  {/* Pilih dari database */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Pilih Anggota Terdaftar (Otomatis Isi Data)
                    </label>
                    <select
                      value={selectedMemberId}
                      onChange={handleMemberSelect}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                    >
                      <option value="">-- Ketik manual atau pilih anggota --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} ({m.memberNumber}) - Regu {m.group?.name || "-"} [
                          {m.scoutLevel}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nama Lengkap Anggota *
                      </label>
                      <input
                        type="text"
                        required
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="Contoh: Muhammad Rizky"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nomor Tanda Anggota (NTA)
                      </label>
                      <input
                        type="text"
                        value={memberNumber}
                        onChange={(e) => setMemberNumber(e.target.value)}
                        placeholder="04.081.2024.001"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Regu / Sangga
                      </label>
                      <input
                        type="text"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Elang / Melati"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tingkatan / Golongan
                      </label>
                      <select
                        value={scoutLevel}
                        onChange={(e) => setScoutLevel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      >
                        <option value="Siaga Mula">Siaga Mula</option>
                        <option value="Siaga Bantu">Siaga Bantu</option>
                        <option value="Siaga Tata">Siaga Tata</option>
                        <option value="Penggalang Ramu">Penggalang Ramu</option>
                        <option value="Penggalang Rakit">Penggalang Rakit</option>
                        <option value="Penggalang Terap">Penggalang Terap</option>
                        <option value="Penegak Bantara">Penegak Bantara</option>
                        <option value="Penegak Laksana">Penegak Laksana</option>
                        <option value="Pandega">Pandega</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Kelas / Jenjang Sekolah (Opsional)
                      </label>
                      <input
                        type="text"
                        value={classGrade}
                        onChange={(e) => setClassGrade(e.target.value)}
                        placeholder="VIII-B / X IPA 2"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: KETERANGAN KEGIATAN & ALASAN */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                    3. Kegiatan & Alasan Ketidakhadiran
                  </span>

                  {/* Jenis Izin (Sakit vs Izin) */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      Kategori Izin *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPermitType("SAKIT")}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer ${
                          permitType === "SAKIT"
                            ? "bg-rose-50 border-rose-400 text-rose-800 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0" />
                        <span>🔴 Sakit / Rawat Jalan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPermitType("IZIN")}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer ${
                          permitType === "IZIN"
                            ? "bg-amber-50 border-amber-400 text-amber-800 shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                        <span>🟡 Izin (Keperluan Keluarga/Mendesak)</span>
                      </button>
                    </div>
                  </div>

                  {/* Pilih Kegiatan */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Pilih Agenda Kegiatan (Atau Tulis Sendiri)
                    </label>
                    <select
                      value={selectedActivityId}
                      onChange={handleActivitySelect}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 mb-2"
                    >
                      <option value="">-- Tulis nama kegiatan sendiri di bawah --</option>
                      {activities.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.title} ({new Date(a.startDate).toLocaleDateString("id-ID")})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      required
                      value={activityTitle}
                      onChange={(e) => setActivityTitle(e.target.value)}
                      placeholder="Nama Kegiatan, contoh: Latihan Rutin & Pioneering Mingguan"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Rentang Tanggal Izin */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Tanggal Mulai Izin *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate || endDate < e.target.value) {
                            setEndDate(e.target.value);
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Sampai Tanggal (Selesai) *
                      </label>
                      <input
                        type="date"
                        required
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Alasan / Keterangan */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Alasan / Keterangan Lengkap *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Jelaskan alasan izin atau kondisi sakit secara jelas..."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 resize-none"
                    />
                  </div>
                </div>

                {/* SECTION 4: TANDA TANGAN & PENGESAHAN */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">
                    4. Penandatangan & Pengesahan
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Nama Orang Tua / Wali *
                      </label>
                      <input
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="Bpk. Hendra Gunawan"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        No. WhatsApp Orang Tua (Opsional)
                      </label>
                      <input
                        type="text"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="081234567890"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mengetahui: Kakak Pembina
                      </label>
                      <select
                        value={leaderName}
                        onChange={handleLeaderSelect}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 mb-1"
                      >
                        {leaders.map((l) => (
                          <option key={l.id} value={l.name}>
                            {l.name} ({l.position})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        placeholder="Nama Pembina"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        NIP / NTA Pembina
                      </label>
                      <input
                        type="text"
                        value={leaderNip}
                        onChange={(e) => setLeaderNip(e.target.value)}
                        placeholder="19850712 201001 1 012"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* STICKY BOTTOM FORM ACTION BAR */}
              <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 shadow-md flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">Lihat Pratinjau</span>
                  <span className="sm:hidden">Pratinjau</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 sm:px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>
                    {loading
                      ? "Menyimpan..."
                      : initialData
                      ? "Simpan Perubahan"
                      : "Terbitkan Surat Izin"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
