"use client";

import React, { useState, useMemo, useRef } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { downloadElementAsPdf } from "@/lib/pdf-export";
import {
  Printer,
  Download,
  Users,
  Wallet,
  CreditCard,
  Filter,
  Loader2,
  FileText,
  Building,
} from "lucide-react";

interface ReportsClientViewProps {
  members: any[];
  groups: any[];
  transactions: any[];
  categories: any[];
  duesList: any[];
  initialBalance: number;
  canViewFinance: boolean;
  organizationProfile?: {
    name?: string;
    pangkalan?: string;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    logoUrl?: string | null;
  } | null;
}

export function ReportsClientView({
  members,
  groups,
  transactions,
  categories,
  duesList,
  initialBalance,
  canViewFinance,
  organizationProfile,
}: ReportsClientViewProps) {
  const [tab, setTab] = useState<"ADMIN" | "FINANCE" | "DUES">("ADMIN");
  const [isDownloading, setIsDownloading] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const orgName = organizationProfile?.name || "Gugus Depan MH SCOUT";
  const orgPangkalan =
    organizationProfile?.pangkalan || "Pangkalan Maslahatul Hidayah";
  const orgAddress =
    organizationProfile?.address ||
    "Jl. Raya Pendidikan No. 45, Kompleks Perguruan Maslahatul Hidayah";
  const orgLogo = organizationProfile?.logoUrl || "/logo.jpeg";

  // Financial summary
  const financeSummary = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap: Record<string, { name: string; type: string; total: number }> = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "PEMASUKAN") income += amt;
      else if (tx.type === "PENGELUARAN") expense += amt;

      const cId = tx.categoryId || "uncategorized";
      if (!catMap[cId]) {
        catMap[cId] = {
          name: tx.category?.name || "Lain-lain",
          type: tx.type,
          total: 0,
        };
      }
      catMap[cId].total += amt;
    });

    const balance = initialBalance + income - expense;
    return { income, expense, balance, catList: Object.values(catMap) };
  }, [transactions, initialBalance]);

  // Member stats by scoutLevel
  const levelStats = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      map[m.scoutLevel] = (map[m.scoutLevel] || 0) + 1;
    });
    return map;
  }, [members]);

  // Dues summary
  const duesSummary = useMemo(() => {
    let totalBilled = 0;
    let totalCollected = 0;
    let pendingCount = 0;

    duesList.forEach((d) => {
      totalBilled += Number(d.amount);
      totalCollected += Number(d.amountPaid);
      if (d.status !== "LUNAS") pendingCount++;
    });

    return {
      totalBilled,
      totalCollected,
      outstanding: totalBilled - totalCollected,
      pendingCount,
    };
  }, [duesList]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsDownloading(true);
    try {
      const tabTitle =
        tab === "ADMIN"
          ? "Administrasi-Keanggotaan"
          : tab === "FINANCE"
          ? "Arus-Kas-Keuangan"
          : "Rekapitulasi-Iuran";
      const fileName = `Laporan-Gudep-${tabTitle}-${formatDate(new Date()).replace(/\s+/g, "-")}`;
      await downloadElementAsPdf(reportContainerRef.current, {
        filename: fileName,
        orientation: tab === "FINANCE" ? "landscape" : "portrait",
      });
    } catch (err: any) {
      console.error("Gagal membuat file PDF laporan:", err);
      alert(err?.message || "Gagal membuat berkas PDF laporan. Silakan coba beberapa saat lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const tabTitleDisplay =
    tab === "ADMIN"
      ? "LAPORAN ADMINISTRASI KEANGGOTAAN"
      : tab === "FINANCE"
      ? "LAPORAN ARUS KAS & PEMBUKUAN KEUANGAN"
      : "LAPORAN REKAPITULASI IURAN ANGGOTA";

  return (
    <div className="space-y-6">
      {/* Action Header (Hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Resmi Gugus Depan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi administrasi keanggotaan dan pembukuan keuangan pangkalan
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tab Selectors */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("ADMIN")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === "ADMIN"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Administrasi
            </button>
            {canViewFinance && (
              <>
                <button
                  type="button"
                  onClick={() => setTab("FINANCE")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tab === "FINANCE"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Arus Kas
                </button>
                <button
                  type="button"
                  onClick={() => setTab("DUES")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tab === "DUES"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Rekap Iuran
                </button>
              </>
            )}
          </div>

          {/* Real PDF File Download Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-xs cursor-pointer disabled:opacity-60"
            title="Unduh langsung file dokumen PDF resmi ke komputer/HP"
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

          {/* Physical Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs transition-all shadow-xs cursor-pointer border border-slate-700"
            title="Cetak langsung menggunakan printer fisik"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Fisik</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINTABLE REPORT DOCUMENT WRAPPER (Captured for PDF) */}
      {/* ============================================================== */}
      <div
        ref={reportContainerRef}
        id="printable-reports-document"
        className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-8 space-y-6 shadow-2xs print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Formal Kop Surat Header for Reports */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src={orgLogo}
                alt="Logo Pramuka"
                className="w-14 h-14 object-contain rounded-lg"
              />
            </div>
            <div className="flex-1 text-center font-sans">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                GERAKAN PRAMUKA GUGUS DEPAN
              </h2>
              <h1 className="text-sm sm:text-lg font-black uppercase text-slate-900 tracking-tight">
                {orgName} • {orgPangkalan}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                {orgAddress}
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 hidden sm:flex items-center justify-center">
              <img
                src="/logo.jpeg"
                alt="Tunas Kelapa"
                className="w-12 h-12 object-contain opacity-90"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 mt-3 pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600">
            <span className="font-bold text-slate-900 uppercase">
              {tabTitleDisplay}
            </span>
            <span>
              Tanggal Rekap: <strong>{formatDate(new Date())}</strong>
            </span>
          </div>
        </div>

        {/* 1. TAB: ADMINISTRASI */}
        {tab === "ADMIN" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Total Anggota
                </span>
                <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                  {members.length} <span className="text-xs font-normal text-slate-500">orang</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Total Regu / Sangga
                </span>
                <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1">
                  {groups.length} <span className="text-xs font-normal text-slate-500">regu</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Penggalang
                </span>
                <p className="text-lg sm:text-2xl font-black text-blue-700 mt-1">
                  {levelStats["PENGGALANG"] || 0} <span className="text-xs font-normal text-slate-500">orang</span>
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Penegak
                </span>
                <p className="text-lg sm:text-2xl font-black text-amber-700 mt-1">
                  {levelStats["PENEGAK"] || 0} <span className="text-xs font-normal text-slate-500">orang</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Rekap Regu */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Daftar Regu / Sangga Terdaftar
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                        <th className="p-2">Nama Regu</th>
                        <th className="p-2">Kategori</th>
                        <th className="p-2 text-right">Jumlah</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groups.map((g) => (
                        <tr key={g.id}>
                          <td className="p-2 font-bold text-slate-900">{g.name}</td>
                          <td className="p-2 text-slate-600">{g.category}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            {g._count?.members || 0} orang
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Rekap Tingkatan */}
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Komposisi Tingkatan Golongan
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                        <th className="p-2">Tingkatan Pramuka</th>
                        <th className="p-2 text-right">Jumlah Anggota</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(levelStats).map(([lvl, count]) => (
                        <tr key={lvl}>
                          <td className="p-2 font-bold text-slate-900">{lvl}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">
                            {count} orang
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: ARUS KAS KEUANGAN */}
        {tab === "FINANCE" && canViewFinance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Saldo Awal
                </span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {formatRupiah(initialBalance)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Total Pemasukan
                </span>
                <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                  {formatRupiah(financeSummary.income)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Total Pengeluaran
                </span>
                <p className="text-lg sm:text-xl font-black text-rose-700 mt-1">
                  {formatRupiah(financeSummary.expense)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase block">
                  Saldo Kas Akhir
                </span>
                <p className="text-lg sm:text-xl font-black text-emerald-900 mt-1">
                  {formatRupiah(financeSummary.balance)}
                </p>
              </div>
            </div>

            {/* Rincian Kategori */}
            <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                Rincian Arus Kas Berdasarkan Kategori
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                      <th className="p-2.5">Kategori Transaksi</th>
                      <th className="p-2.5">Jenis</th>
                      <th className="p-2.5 text-right">Total Akumulasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {financeSummary.catList.map((cat, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-900">{cat.name}</td>
                        <td className="p-2.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              cat.type === "PEMASUKAN"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {cat.type}
                          </span>
                        </td>
                        <td
                          className={`p-2.5 text-right font-black ${
                            cat.type === "PEMASUKAN"
                              ? "text-emerald-700"
                              : "text-rose-700"
                          }`}
                        >
                          {formatRupiah(cat.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: REKAP IURAN */}
        {tab === "DUES" && canViewFinance && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase block">
                  Total Tagihan Iuran
                </span>
                <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1">
                  {formatRupiah(duesSummary.totalBilled)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 uppercase block">
                  Iuran Terkumpul (Lunas)
                </span>
                <p className="text-lg sm:text-2xl font-black text-emerald-700 mt-1">
                  {formatRupiah(duesSummary.totalCollected)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 uppercase block">
                  Sisa Tunggakan
                </span>
                <p className="text-lg sm:text-2xl font-black text-amber-700 mt-1">
                  {formatRupiah(duesSummary.outstanding)}
                </p>
              </div>
            </div>

            {/* Daftar Rincian Iuran */}
            {duesList.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                  Daftar Catatan Iuran Anggota
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                        <th className="p-2.5">No</th>
                        <th className="p-2.5">Nama Anggota</th>
                        <th className="p-2.5">Tagihan</th>
                        <th className="p-2.5">Dibayar</th>
                        <th className="p-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {duesList.slice(0, 30).map((d, idx) => (
                        <tr key={d.id || idx}>
                          <td className="p-2.5 text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {d.member?.name || "Anggota"}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {formatRupiah(Number(d.amount))}
                          </td>
                          <td className="p-2.5 font-bold text-emerald-700">
                            {formatRupiah(Number(d.amountPaid))}
                          </td>
                          <td className="p-2.5 text-right">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                d.status === "LUNAS"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Formal Signature Block for Scout Official Reports */}
        <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-sans">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-1">Ketua Gugus Depan</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">Pembina Gugus Depan</p>
            <p className="text-[10px] text-slate-500">NTA. Gerakan Pramuka</p>
          </div>
          <div>
            <p className="text-slate-500">Dibuat & Diverifikasi oleh,</p>
            <p className="font-bold text-slate-900 mt-1">
              {tab === "ADMIN" ? "Sekretaris Gugus Depan" : "Bendahara Gugus Depan"}
            </p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">Pengurus Satuan</p>
            <p className="text-[10px] text-slate-500">MH Scout Pangkalan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
