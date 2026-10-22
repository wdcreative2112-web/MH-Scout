"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitLeavePermitAction } from "@/actions/letters";
import { formatDayDate, formatDate } from "@/lib/utils";
import {
  FileText,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  Users,
  Shield,
  Calendar,
  AlertTriangle,
  XCircle,
  Check,
} from "lucide-react";

interface LeaveLetterItem {
  id: string;
  letterNumber: string;
  subject: string;
  status: string;
  date: string;
  createdAt: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  groupId: string;
  groupName: string;
  permitType: "IZIN" | "SAKIT";
  reason: string;
  parentName: string;
  statusApproval: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  submittedByName: string;
  approvedByName?: string;
  approvedAt?: string;
}

interface LeavePermitClientViewProps {
  group: any | null;
  members: Array<{
    id: string;
    fullName: string;
    memberNumber?: string | null;
    groupId?: string | null;
  }>;
  meetings: Array<{
    id: string;
    title: string;
    meetingDate: string;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    status: string;
  }>;
  leaveLetters: LeaveLetterItem[];
  userRole: string;
  userName?: string | null;
}

export function LeavePermitClientView({
  group,
  members,
  meetings,
  leaveLetters,
  userRole,
  userName,
}: LeavePermitClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form State
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(
    meetings.length > 0 ? meetings[0].id : ""
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members.length > 0 ? members[0].id : ""
  );
  const [permitType, setPermitType] = useState<"IZIN" | "SAKIT">("IZIN");
  const [reason, setReason] = useState<string>("");
  const [parentName, setParentName] = useState<string>("Orang Tua / Wali");
  const [parentPhone, setParentPhone] = useState<string>("");

  // Feedback State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filter State for History
  const [statusFilter, setStatusFilter] = useState<"ALL" | "MENUNGGU" | "DISETUJUI" | "DITOLAK">("ALL");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Urutkan meetings: sesi mendatang/hari ini paling atas
  const sortedMeetings = [...meetings].sort((a, b) => {
    return new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime();
  });

  const filteredHistory = leaveLetters.filter((item) => {
    if (statusFilter === "ALL") return true;
    return item.statusApproval === statusFilter;
  });

  const countPending = leaveLetters.filter((l) => l.statusApproval === "MENUNGGU").length;
  const countApproved = leaveLetters.filter((l) => l.statusApproval === "DISETUJUI").length;
  const countRejected = leaveLetters.filter((l) => l.statusApproval === "DITOLAK").length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedMeetingId) {
      setErrorMsg("Silakan pilih sesi pertemuan latihan yang dituju.");
      return;
    }
    if (!selectedMemberId) {
      setErrorMsg("Silakan pilih anggota regu yang berhalangan.");
      return;
    }
    if (!reason.trim()) {
      setErrorMsg("Silakan isi alasan atau keterangan ketidakhadiran.");
      return;
    }

    startTransition(async () => {
      const res = await submitLeavePermitAction({
        meetingId: selectedMeetingId,
        memberId: selectedMemberId,
        permitType,
        reason: reason.trim(),
        parentName: parentName.trim() || "Orang Tua / Wali",
        parentPhone: parentPhone.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || "Gagal mengajukan izin.");
      } else {
        setSuccessMsg(
          `Surat izin untuk ${
            members.find((m) => m.id === selectedMemberId)?.fullName || "anggota"
          } berhasil dikirim ke Admin/Pembina.`
        );
        setReason("");
        setParentPhone("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in-50 duration-200">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/attendance"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Presensi Latihan</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Pengajuan Izin / Sakit Anggota</span>
                {group && (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {group.name}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ajukan permohonan izin lebih awal (sebelum atau pada hari-H). Status otomatis masuk presensi setelah di-ACC Admin.
              </p>
            </div>
          </div>
        </div>

        {group && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-2xl shrink-0">
            <Shield className="w-4 h-4 text-emerald-700" />
            <div className="text-right sm:text-left">
              <p className="text-[10px] uppercase font-bold text-slate-400">Regu Saya</p>
              <p className="text-xs font-black text-slate-800">
                {group.name} ({members.length} Anggota)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Notice Box */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-start gap-3 text-xs leading-relaxed shadow-2xs">
        <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold block text-blue-950 mb-0.5">
            Petunjuk Pengajuan Izin / Sakit (Sebelum Hari-H):
          </strong>
          <span>
            Jika ada anggota regu yang mengabarkan tidak dapat mengikuti latihan (misal H-1 atau sebelum upacara dimulai),
            Ketua Regu mengajukan surat permohonan melalui formulir di bawah ini. Ketika Admin/Pembina menyetujui (ACC),
            status di lembar presensi otomatis terisi <strong>IZIN</strong> atau <strong>SAKIT</strong> dan anggota bebas dari denda alpa.
          </span>
        </div>
      </div>

      {/* Main Grid: Form on Left, History on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Column (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="font-black text-sm text-slate-900">Formulir Permohonan Izin</h2>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Sesi Pertemuan Latihan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Pilih Sesi Latihan Yang Dituju *
              </label>
              <select
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900"
                required
              >
                {sortedMeetings.map((m) => {
                  const mDate = new Date(m.meetingDate);
                  const isFuture = mDate.getTime() > today.getTime();
                  const isToday =
                    mDate.getFullYear() === today.getFullYear() &&
                    mDate.getMonth() === today.getMonth() &&
                    mDate.getDate() === today.getDate();

                  let badge = "";
                  if (isToday) badge = " [🟢 Hari Ini]";
                  else if (isFuture) badge = " [📅 Mendatang]";

                  return (
                    <option key={m.id} value={m.id}>
                      {formatDayDate(m.meetingDate)} — {m.title}
                      {badge}
                    </option>
                  );
                })}
                {sortedMeetings.length === 0 && (
                  <option value="">(Belum ada jadwal sesi latihan)</option>
                )}
              </select>
            </div>

            {/* 2. Pilih Anggota Regu */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Pilih Anggota Regu *
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white text-slate-900"
                required
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} {m.memberNumber ? `(${m.memberNumber})` : ""}
                  </option>
                ))}
                {members.length === 0 && (
                  <option value="">(Tidak ada anggota terdaftar)</option>
                )}
              </select>
            </div>

            {/* 3. Jenis Ketidakhadiran */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Jenis Ketidakhadiran *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPermitType("IZIN")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    permitType === "IZIN"
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Izin (Keperluan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPermitType("SAKIT")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    permitType === "SAKIT"
                      ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Sakit</span>
                </button>
              </div>
            </div>

            {/* 4. Alasan / Keterangan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Alasan / Keperluan Ketidakhadiran *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  permitType === "SAKIT"
                    ? "Contoh: Mengalami demam dan disarankan istirahat oleh dokter..."
                    : "Contoh: Ada keperluan keluarga mendadak ke luar kota..."
                }
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                required
              />
            </div>

            {/* 5. Orang Tua / Wali */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nama Orang Tua / Wali
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Nama orang tua/wali"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  No. Telepon / WA Wali
                </label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="0812xxxx (opsional)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending || members.length === 0 || sortedMeetings.length === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengirim Permohonan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim Surat Permohonan Izin</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History Column (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-black text-sm text-slate-900">Riwayat Pengajuan Izin Regu</h2>
              <p className="text-[11px] text-slate-500">
                Status verifikasi surat oleh Admin / Pembina Satuan.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-slate-800 text-white border-slate-800"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Semua ({leaveLetters.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("MENUNGGU")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  statusFilter === "MENUNGGU"
                    ? "bg-amber-600 text-white border-amber-600"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                Menunggu ({countPending})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DISETUJUI")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  statusFilter === "DISETUJUI"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                Disetujui ({countApproved})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("DITOLAK")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  statusFilter === "DITOLAK"
                    ? "bg-rose-600 text-white border-rose-600"
                    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                }`}
              >
                Ditolak ({countRejected})
              </button>
            </div>
          </div>

          {/* List of Requests */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        item.permitType === "SAKIT"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.permitType === "SAKIT" ? "Sakit" : "Izin"}
                    </span>
                    <strong className="text-xs font-bold text-slate-900">
                      {item.memberName}
                    </strong>
                    {item.memberNumber && (
                      <span className="text-[10px] text-slate-400">
                        ({item.memberNumber})
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.statusApproval === "DISETUJUI" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Disetujui (Masuk Presensi)</span>
                      </span>
                    ) : item.statusApproval === "DITOLAK" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>Ditolak</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Menunggu ACC Admin</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Sesi Latihan:</span>{" "}
                  {item.meetingDate ? formatDayDate(item.meetingDate) : "-"} {item.meetingTitle ? `(${item.meetingTitle})` : ""}
                </div>

                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800">Alasan:</span> {item.reason}
                  {item.parentName && (
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Wali: {item.parentName}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>Surat: {item.letterNumber}</span>
                  <span>Diajukan: {formatDate(item.createdAt)}</span>
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Belum ada permohonan surat izin yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
