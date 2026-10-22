"use client";

import React, { useRef, useState } from "react";
import {
  PermitLetterData,
  formatPermitWhatsAppMessage,
  getPermitWhatsAppShareUrl,
} from "@/lib/permit-letter";
import { formatDate, formatDayDate } from "@/lib/utils";
import { downloadElementAsPdf } from "@/lib/pdf-export";
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  X,
  FileText,
  Building,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/public/ShareBar";

interface PermitLetterTemplateProps {
  data: PermitLetterData;
  organization?: {
    name?: string;
    pangkalan?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  } | null;
  showActions?: boolean;
  onClose?: () => void;
  printUrl?: string;
}

export function PermitLetterTemplate({
  data,
  organization,
  showActions = true,
  onClose,
  printUrl,
}: PermitLetterTemplateProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  const orgName = organization?.name || "Gugus Depan MH SCOUT";
  const orgPangkalan =
    organization?.pangkalan || "Pangkalan Gerakan Pramuka Maslahatul Hidayah";
  const orgAddress =
    organization?.address ||
    "Jl. Raya Pendidikan No. 45, Kompleks Perguruan Maslahatul Hidayah";
  const orgPhone = organization?.phone || "+62 (021) 555-PRAMUKA / 0812-3456-7890";
  const orgEmail = organization?.email || "sekretariat@mhscout.id";
  const orgLogo = organization?.logoUrl || "/logo.jpeg";

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setIsDownloading(true);
    try {
      const fileName = `Surat-Izin-${data.memberName || "Anggota"}-${data.letterNumber || "001"}`;
      await downloadElementAsPdf(printContainerRef.current, {
        filename: fileName,
        orientation: "portrait",
      });
    } catch (err: any) {
      console.error("Gagal mengunduh PDF:", err);
      alert(err?.message || "Gagal membuat berkas PDF. Silakan coba beberapa saat lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const directUrl =
      printUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/letters?viewPermitId=${data.id || ""}`
        : "");
    const waUrl = getPermitWhatsAppShareUrl(data, directUrl);
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyText = async () => {
    const directUrl =
      printUrl ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/letters?viewPermitId=${data.id || ""}`
        : "");
    const text = formatPermitWhatsAppMessage(data, directUrl);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const isSakit = data.permitType === "SAKIT";
  const dateRangeDisplay =
    data.startDate === data.endDate || !data.endDate
      ? formatDayDate(data.startDate)
      : `${formatDayDate(data.startDate)} s.d. ${formatDayDate(data.endDate)}`;

  return (
    <div className="space-y-4">
      {/* Action Toolbar (Hidden during print) */}
      {showActions && (
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">
                Surat Izin Resmi Anggota
              </h4>
              <p className="text-[10px] sm:text-[11px] text-slate-300">
                Format kop & isi standar Gerakan Pramuka
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Real PDF File Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
              title="Unduh langsung file dokumen PDF resmi ke perangkat"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Unduh File PDF</span>
                </>
              )}
            </button>

            {/* Physical Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer border border-slate-700"
              title="Cetak langsung menggunakan printer fisik"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Cetak Fisik</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
              title="Kirim ke WhatsApp Pembina / Orang Tua"
            >
              <WhatsAppIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>WhatsApp</span>
            </button>

            {/* Copy Text Button */}
            <button
              type="button"
              onClick={handleCopyText}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
                copied
                  ? "bg-emerald-700 text-white"
                  : "bg-white/10 hover:bg-white/20 text-slate-200"
              }`}
              title="Salin ringkasan surat ke clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Teks</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                title="Tutup Pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* PAPER SHEET CONTAINER (A4 Proportions) */}
      <div className="overflow-x-auto pb-4 print:p-0 print:m-0 print:overflow-visible">
        <div
          ref={printContainerRef}
          id="printable-permit-letter"
          className="mx-auto bg-white text-slate-900 shadow-xl border border-slate-200 rounded-sm p-4 sm:p-8 md:p-12 w-full max-w-[210mm] min-h-[260mm] font-serif text-xs sm:text-[13px] leading-relaxed relative print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:min-h-0"
          style={{ boxSizing: "border-box" }}
        >
          {/* ============================================================== */}
          {/* 1. KOP SURAT RESMI (HEADER) */}
          {/* ============================================================== */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 pb-2">
            {/* Logo Kiri */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src={orgLogo}
                alt="Logo Pramuka"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-lg"
              />
            </div>

            {/* Teks Kop Tengah */}
            <div className="flex-1 text-center font-sans tracking-wide">
              <h2 className="text-xs sm:text-base font-black text-slate-950 uppercase leading-tight sm:leading-snug">
                GERAKAN PRAMUKA
              </h2>
              <h1 className="text-[11px] sm:text-sm font-extrabold text-slate-900 uppercase leading-tight sm:leading-snug">
                {orgName}
              </h1>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-900 uppercase">
                {orgPangkalan}
              </p>
              <p className="text-[9px] sm:text-[11px] text-slate-600 mt-0.5 font-normal leading-tight">
                {orgAddress}
              </p>
              <p className="text-[8px] sm:text-[10px] text-slate-500 font-normal">
                Telp/WhatsApp: {orgPhone} | Pos-el: {orgEmail}
              </p>
            </div>

            {/* Emblem Kanan (WOSM / Tunas Kelapa Placeholder or balance spacer) */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 hidden sm:flex items-center justify-center opacity-90">
              <img
                src={orgLogo}
                alt="Emblem Pramuka"
                className="w-14 h-14 sm:w-16 sm:h-16 object-contain grayscale"
              />
            </div>
          </div>

          {/* Garis Pembatas Kop Surat Resmi (Double Border Line) */}
          <div className="border-t-[3px] border-b-[1px] border-black my-2 pt-[1.5px]" />

          {/* ============================================================== */}
          {/* 2. METADATA SURAT (TANGGAL & NOMOR) */}
          {/* ============================================================== */}
          <div className="text-right text-xs font-sans text-slate-800 mt-4 mb-3">
            <span>
              {data.createdPlace || "Jakarta"},{" "}
              {formatDate(data.date || new Date())}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans mb-5">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-20 text-slate-600">Nomor</span>
                <span className="w-3 text-center">:</span>
                <span className="font-mono font-bold text-slate-900">
                  {data.letterNumber}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-600">Lampiran</span>
                <span className="w-3 text-center">:</span>
                <span className="text-slate-800">
                  {isSakit
                    ? "1 (satu) Berkas / Surat Dokter"
                    : "-"}
                </span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-600">Perihal</span>
                <span className="w-3 text-center">:</span>
                <span className="font-bold text-slate-950 underline decoration-slate-400 underline-offset-2">
                  Permohonan Izin Tidak Mengikuti Kegiatan Pramuka
                </span>
              </div>
            </div>

            {/* Penerima */}
            <div className="sm:text-right space-y-0.5">
              <p className="text-slate-600">Kepada Yth.</p>
              <p className="font-bold text-slate-900">
                Kakak Pembina Gugus Depan / Pembina Satuan
              </p>
              <p className="text-slate-700">{orgName}</p>
              <p className="text-slate-500 italic">di Tempat</p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 3. ISI SURAT (BODY) */}
          {/* ============================================================== */}
          <div className="space-y-3.5 text-slate-900 text-justify text-[13px] leading-relaxed">
            <p className="font-bold font-sans text-emerald-950 tracking-wider">
              Salam Pramuka,
            </p>

            <p>
              Dengan hormat, yang bertanda tangan di bawah ini orang tua / wali
              dari anggota Gerakan Pramuka Gugus Depan {orgName}:
            </p>

            {/* Tabel Rincian Anggota */}
            <div className="my-2.5 px-3 sm:px-4 py-2.5 bg-slate-50/80 rounded-lg border border-slate-200 font-sans text-xs space-y-1.5 print:bg-transparent print:border-slate-300">
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Nama Lengkap Anggota
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-bold text-slate-950 uppercase">
                  {data.memberName}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Nomor Tanda Anggota (NTA)
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-mono text-slate-900">
                  {data.memberNumber || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Regu / Sangga
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-semibold text-slate-900">
                  Regu {data.groupName || "-"}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Golongan / Tingkatan
                </span>
                <span className="w-4 text-center">:</span>
                <span className="text-slate-900">
                  {data.scoutLevel || "Penggalang"}
                </span>
              </div>
              {data.classGrade && (
                <div className="flex">
                  <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                    Kelas / Jenjang Sekolah
                  </span>
                  <span className="w-4 text-center">:</span>
                  <span className="text-slate-900">{data.classGrade}</span>
                </div>
              )}
            </div>

            <p>
              Dengan ini kami memberitahukan dan memohon izin bahwa putra/putri
              kami tersebut di atas berhalangan hadir dan tidak dapat mengikuti
              kegiatan kepramukaan:
            </p>

            {/* Rincian Kegiatan & Alasan */}
            <div className="my-2.5 px-3 sm:px-4 py-2.5 bg-slate-50/80 rounded-lg border border-slate-200 font-sans text-xs space-y-1.5 print:bg-transparent print:border-slate-300">
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Nama Kegiatan
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-bold text-slate-950">
                  {data.activityTitle}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Hari & Tanggal
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-semibold text-slate-900">
                  {dateRangeDisplay}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Kategori Izin
                </span>
                <span className="w-4 text-center">:</span>
                <span className="font-bold text-slate-900">
                  {isSakit
                    ? "🔴 SAKIT (Memerlukan Istirahat / Pengobatan)"
                    : "🟡 IZIN (Keperluan Keluarga / Mendesak)"}
                </span>
              </div>
              <div className="flex items-start">
                <span className="w-32 sm:w-44 shrink-0 font-semibold text-slate-700">
                  Alasan & Keterangan
                </span>
                <span className="w-4 text-center shrink-0">:</span>
                <span className="font-normal text-slate-900 italic">
                  "{data.reason}"
                </span>
              </div>
            </div>

            <p>
              Demikian surat permohonan izin ini kami sampaikan dengan
              sebenar-benarnya. Atas perhatian, pengertian, dan izin yang
              diberikan oleh Kakak Pembina, kami haturkan terima kasih.
            </p>

            <p className="font-bold font-sans text-emerald-950 pt-1">
              Salam Pramuka.
            </p>
          </div>

          {/* ============================================================== */}
          {/* 4. TANDA TANGAN & PENGESAHAN (FOOTER) */}
          {/* ============================================================== */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs font-sans mt-12 pt-4">
            {/* Kolom Kiri: Pembina yang Mengetahui */}
            <div className="space-y-1">
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">
                Pembina Gugus Depan / Satuan
              </p>
              {/* Ruang TTD */}
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan & Cap)
              </div>
              <p className="font-bold text-slate-950 underline underline-offset-2">
                {data.leaderName || "Pembina Satuan"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NTA/NIP: {data.leaderNip || "-"}
              </p>
            </div>

            {/* Kolom Kanan: Orang Tua / Wali */}
            <div className="space-y-1">
              <p className="text-slate-600">Hormat kami,</p>
              <p className="font-bold text-slate-900">Orang Tua / Wali Murid</p>
              {/* Ruang TTD */}
              <div className="h-16 flex items-center justify-center text-slate-300 italic text-[11px]">
                (Tanda Tangan)
              </div>
              <p className="font-bold text-slate-950 underline underline-offset-2">
                {data.parentName || "Orang Tua / Wali"}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {data.parentPhone ? `Telp: ${data.parentPhone}` : "Wali Resmi"}
              </p>
            </div>
          </div>

          {/* Watermark / Catatan Kaki Dokumen */}
          <div className="mt-14 pt-3 border-t border-slate-200 text-center font-sans text-[10px] text-slate-400">
            <p>
              Dokumen Administrasi Resmi {orgName} — Diterbitkan melalui Sistem
              Informasi Manajemen Pramuka Terpadu (MH SCOUT)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
