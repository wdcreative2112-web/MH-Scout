"use client";

import React, { useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { downloadElementAsPdf } from "@/lib/pdf-export";
import { Printer, Download, FileText, Loader2 } from "lucide-react";

interface GeneralLetterTemplateProps {
  letter: {
    id: string;
    letterNumber: string;
    type: string;
    date: Date | string;
    subject: string;
    sender?: string | null;
    recipient?: string | null;
    summary?: string | null;
    status: string;
  };
  organization?: {
    name?: string;
    pangkalan?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  } | null;
}

export function GeneralLetterTemplate({
  letter,
  organization,
}: GeneralLetterTemplateProps) {
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
      const fileName = `Arsip-Surat-${letter.letterNumber.replace(/\//g, "-")}`;
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

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Lembar Arsip Surat Resmi
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-300">
              {letter.type === "MASUK" ? "Surat Masuk Eksternal" : "Surat Keluar Gugus Depan"} • {letter.letterNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Unduh file dokumen PDF ke perangkat"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Membuat PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File PDF</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer border border-slate-700"
            title="Cetak langsung menggunakan printer fisik"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Fisik</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="overflow-x-auto pb-4 print:p-0 print:m-0 print:overflow-visible">
        <div
          ref={printContainerRef}
          id="printable-general-letter"
          className="mx-auto bg-white text-slate-900 shadow-xl border border-slate-200 rounded-sm p-6 sm:p-10 md:p-12 w-full max-w-[210mm] min-h-[260mm] font-serif text-xs sm:text-[13px] leading-relaxed relative print:m-0 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none print:min-h-0"
        >
          {/* KOP SURAT */}
          <div className="flex items-center justify-between gap-3 sm:gap-4 pb-2">
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src={orgLogo}
                alt="Logo Pramuka"
                className="w-12 h-12 sm:w-18 sm:h-18 object-contain rounded-lg"
              />
            </div>
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
            <div className="w-14 h-14 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <img
                src="/logo.jpeg"
                alt="Tunas Kelapa"
                className="w-10 h-10 sm:w-16 sm:h-16 object-contain opacity-90"
              />
            </div>
          </div>

          <div className="border-b-[3px] border-slate-900 my-1" />
          <div className="border-b border-slate-700 mb-6" />

          {/* Metadata Surat */}
          <div className="space-y-1 font-sans text-xs">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p><span className="font-bold w-24 inline-block">Nomor</span>: {letter.letterNumber}</p>
                <p><span className="font-bold w-24 inline-block">Lampiran</span>: -</p>
                <p><span className="font-bold w-24 inline-block">Perihal</span>: <strong className="font-serif">{letter.subject}</strong></p>
                <p><span className="font-bold w-24 inline-block">Kategori</span>: {letter.type === "MASUK" ? "Surat Masuk" : "Surat Keluar"}</p>
              </div>
              <div className="text-right">
                <p>Tanggal: {formatDate(letter.date)}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Status: {letter.status}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4 space-y-1">
              <p><span className="font-bold w-24 inline-block">Pengirim</span>: {letter.sender || "-"}</p>
              <p><span className="font-bold w-24 inline-block">Tujuan</span>: {letter.recipient || "-"}</p>
            </div>
          </div>

          {/* Isi / Ringkasan Surat */}
          <div className="mt-8 space-y-4">
            <h3 className="font-bold font-sans text-sm border-b border-slate-200 pb-1">
              Ringkasan Pokok Surat & Catatan Administrasi:
            </h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed font-sans text-xs whitespace-pre-line min-h-[120px]">
              {letter.summary || "Tidak ada ringkasan teks tercatat untuk arsip dokumen ini."}
            </div>
          </div>

          {/* Tanda Tangan Pembina / Sekretariat */}
          <div className="mt-16 pt-8 grid grid-cols-2 text-center text-xs font-sans">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-1">Ketua Gugus Depan</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">Pembina Gudep</p>
              <p className="text-[10px] text-slate-500">NTA. Pramuka</p>
            </div>
            <div>
              <p className="text-slate-500">Dicatat & Diverifikasi oleh,</p>
              <p className="font-bold text-slate-900 mt-1">Sekretaris Gugus Depan</p>
              <div className="h-16" />
              <p className="font-bold underline text-slate-900">Staf Administrasi</p>
              <p className="text-[10px] text-slate-500">MH Scout Pangkalan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
