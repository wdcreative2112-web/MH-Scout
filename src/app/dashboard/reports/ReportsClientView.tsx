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
  Search,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Scale,
  Receipt,
  Layers,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Eye,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  X,
  PieChart,
  Coins,
} from "lucide-react";

interface SignatoryInfo {
  name: string;
  nip?: string;
}

interface ReportsClientViewProps {
  members: any[];
  groups: any[];
  transactions: any[];
  categories: any[];
  duesList: any[];
  finesList: any[];
  donationsList: any[];
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
  signatories?: {
    kaGudep: SignatoryInfo;
    bendahara: SignatoryInfo;
    ketuaMabigus: SignatoryInfo;
  };
}

type TabType = "OVERVIEW" | "CASH_BOOK" | "DUES" | "FINES" | "DONATIONS" | "ADMIN";
type PeriodType = "ALL" | "THIS_MONTH" | "LAST_MONTH" | "THIS_YEAR" | "CUSTOM";
type ViewMode = "DASHBOARD" | "PRINT_PREVIEW";

export function ReportsClientView({
  members,
  groups,
  transactions,
  categories,
  duesList,
  finesList,
  donationsList,
  initialBalance,
  canViewFinance,
  organizationProfile,
  signatories,
}: ReportsClientViewProps) {
  // Navigation & View Mode
  const [tab, setTab] = useState<TabType>(canViewFinance ? "OVERVIEW" : "ADMIN");
  const [viewMode, setViewMode] = useState<ViewMode>("DASHBOARD");

  // Filters State
  const [period, setPeriod] = useState<PeriodType>("THIS_MONTH");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState<"ALL" | "PEMASUKAN" | "PENGELUARAN">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "LUNAS" | "BELUM_LUNAS">("ALL");
  const [isDownloading, setIsDownloading] = useState(false);

  // Print ref
  const reportContainerRef = useRef<HTMLDivElement>(null);

  // Profile data
  const orgName = organizationProfile?.name || "Gugus Depan MH SCOUT";
  const orgPangkalan = organizationProfile?.pangkalan || "Pangkalan Maslahatul Hidayah";
  const orgAddress =
    organizationProfile?.address ||
    "Kompleks Perguruan Maslahatul Hidayah, Gerakan Pramuka";
  const orgLogo = organizationProfile?.logoUrl || "/logo.jpeg";

  // Signatory names & NTAs
  const kaGudepName = signatories?.kaGudep?.name || "Pembina Gugus Depan";
  const kaGudepNip = signatories?.kaGudep?.nip || "";
  const bendaharaName = signatories?.bendahara?.name || "Bendahara Gugus Depan";
  const bendaharaNip = signatories?.bendahara?.nip || "";
  const mabigusName = signatories?.ketuaMabigus?.name || "Ketua Mabigus";
  const mabigusNip = signatories?.ketuaMabigus?.nip || "";

  // Date boundaries for period filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    if (period === "THIS_MONTH") {
      const start = new Date(curYear, curMonth, 1);
      const end = new Date(curYear, curMonth + 1, 0, 23, 59, 59, 999);
      return { start, end, label: `Bulan Ini (${now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})` };
    }
    if (period === "LAST_MONTH") {
      const start = new Date(curYear, curMonth - 1, 1);
      const end = new Date(curYear, curMonth, 0, 23, 59, 59, 999);
      const prevDate = new Date(curYear, curMonth - 1, 1);
      return { start, end, label: `Bulan Lalu (${prevDate.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})` };
    }
    if (period === "THIS_YEAR") {
      const start = new Date(curYear, 0, 1);
      const end = new Date(curYear, 11, 31, 23, 59, 59, 999);
      return { start, end, label: `Tahun ${curYear}` };
    }
    if (period === "CUSTOM" && customStartDate) {
      const start = new Date(`${customStartDate}T00:00:00`);
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999`) : new Date();
      return { start, end, label: `${customStartDate} s.d. ${customEndDate || "Hari Ini"}` };
    }
    return { start: null, end: null, label: "Semua Waktu" };
  }, [period, customStartDate, customEndDate]);

  // Helper date checker
  const isDateInFilter = (dateVal: string | Date | null | undefined): boolean => {
    if (!dateVal || !dateRange.start || !dateRange.end) return true;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return true;
    return d >= dateRange.start && d <= dateRange.end;
  };

  // 1. FILTERED TRANSACTIONS & RUNNING BALANCE
  const { filteredTransactions, periodIncome, periodExpense, allTransactionsChronological } = useMemo(() => {
    const chrono = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = initialBalance;
    const enriched = chrono.map((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "PEMASUKAN") {
        running += amt;
      } else {
        running -= amt;
      }
      return {
        ...tx,
        amountNum: amt,
        runningBalance: running,
      };
    });

    const reversedEnriched = [...enriched].reverse();

    const filtered = reversedEnriched.filter((tx) => {
      if (!isDateInFilter(tx.date)) return false;
      if (txTypeFilter !== "ALL" && tx.type !== txTypeFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (tx.title || "").toLowerCase().includes(q);
        const refMatch = (tx.referenceNo || "").toLowerCase().includes(q);
        const partyMatch = (tx.sourceOrRecipient || "").toLowerCase().includes(q);
        const catMatch = (tx.category?.name || "").toLowerCase().includes(q);
        if (!titleMatch && !refMatch && !partyMatch && !catMatch) return false;
      }
      return true;
    });

    let pInc = 0;
    let pExp = 0;
    filtered.forEach((tx) => {
      if (tx.type === "PEMASUKAN") pInc += tx.amountNum;
      else if (tx.type === "PENGELUARAN") pExp += tx.amountNum;
    });

    return {
      filteredTransactions: filtered,
      periodIncome: pInc,
      periodExpense: pExp,
      allTransactionsChronological: enriched,
    };
  }, [transactions, initialBalance, dateRange, txTypeFilter, searchQuery]);

  // Overall totals across all time
  const overallTotals = useMemo(() => {
    let totInc = 0;
    let totExp = 0;
    const catBreakdown: Record<string, { name: string; type: string; total: number }> = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === "PEMASUKAN") totInc += amt;
      else if (tx.type === "PENGELUARAN") totExp += amt;

      const cId = tx.categoryId || "lain";
      if (!catBreakdown[cId]) {
        catBreakdown[cId] = {
          name: tx.category?.name || "Lain-lain",
          type: tx.type,
          total: 0,
        };
      }
      catBreakdown[cId].total += amt;
    });

    const currentBalance = initialBalance + totInc - totExp;
    return {
      totalIncome: totInc,
      totalExpense: totExp,
      currentBalance,
      categories: Object.values(catBreakdown).sort((a, b) => b.total - a.total),
    };
  }, [transactions, initialBalance]);

  // 2. FILTERED DUES
  const { filteredDues, duesBilled, duesCollected, duesOutstanding } = useMemo(() => {
    const list = duesList.filter((d) => {
      if (!isDateInFilter(d.paidAt || d.createdAt)) return false;
      if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const memberName = (d.member?.fullName || d.member?.name || "").toLowerCase();
        const groupName = (d.member?.group?.name || "").toLowerCase();
        const duesTypeName = (d.duesType?.name || "").toLowerCase();
        const periodName = (d.periodName || "").toLowerCase();
        if (!memberName.includes(q) && !groupName.includes(q) && !duesTypeName.includes(q) && !periodName.includes(q)) {
          return false;
        }
      }
      return true;
    });

    let billed = 0;
    let collected = 0;
    list.forEach((d) => {
      billed += Number(d.amount) || 0;
      collected += Number(d.amountPaid) || 0;
    });

    return {
      filteredDues: list,
      duesBilled: billed,
      duesCollected: collected,
      duesOutstanding: billed - collected,
    };
  }, [duesList, dateRange, statusFilter, searchQuery]);

  // 3. FILTERED FINES (DENDA ALPA PRESENSI)
  const { filteredFines, finesBilled, finesCollected, finesOutstanding, finesLunasCount, finesBelumCount } = useMemo(() => {
    const list = finesList.filter((f) => {
      if (!isDateInFilter(f.paidAt || f.createdAt)) return false;
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const memberName = (f.member?.fullName || f.member?.name || "").toLowerCase();
        const groupName = (f.member?.group?.name || "").toLowerCase();
        const periodName = (f.periodName || "").toLowerCase();
        if (!memberName.includes(q) && !groupName.includes(q) && !periodName.includes(q)) {
          return false;
        }
      }
      return true;
    });

    let billed = 0;
    let collected = 0;
    let lunas = 0;
    let belum = 0;

    list.forEach((f) => {
      billed += Number(f.amount) || 0;
      collected += Number(f.amountPaid) || 0;
      if (f.status === "LUNAS") lunas++;
      else belum++;
    });

    return {
      filteredFines: list,
      finesBilled: billed,
      finesCollected: collected,
      finesOutstanding: billed - collected,
      finesLunasCount: lunas,
      finesBelumCount: belum,
    };
  }, [finesList, dateRange, statusFilter, searchQuery]);

  // 4. FILTERED DONATIONS
  const { filteredDonations, totalDonationsVerified } = useMemo(() => {
    const list = donationsList.filter((don) => {
      if (!isDateInFilter(don.createdAt)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const donorName = (don.donorName || "").toLowerCase();
        const campaignTitle = (don.campaign?.title || "").toLowerCase();
        const donationNumber = (don.donationNumber || "").toLowerCase();
        if (!donorName.includes(q) && !campaignTitle.includes(q) && !donationNumber.includes(q)) {
          return false;
        }
      }
      return true;
    });

    const sum = list.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
    return {
      filteredDonations: list,
      totalDonationsVerified: sum,
    };
  }, [donationsList, dateRange, searchQuery]);

  // Member stats by scoutLevel
  const levelStats = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => {
      map[m.scoutLevel] = (map[m.scoutLevel] || 0) + 1;
    });
    return map;
  }, [members]);

  // Income sources proportion calculation for visual breakdown
  const incomeBreakdown = useMemo(() => {
    const totalAllInflow = (duesCollected + finesCollected + totalDonationsVerified) || 1;
    const duesPct = Math.round((duesCollected / totalAllInflow) * 100);
    const finesPct = Math.round((finesCollected / totalAllInflow) * 100);
    const donPct = Math.max(0, 100 - duesPct - finesPct);
    return {
      duesPct,
      finesPct,
      donPct,
      totalAllInflow,
    };
  }, [duesCollected, finesCollected, totalDonationsVerified]);

  // Print physical action
  const handlePrint = () => {
    window.print();
  };

  // PDF Download action
  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsDownloading(true);
    try {
      const tabTitleMap: Record<TabType, string> = {
        OVERVIEW: "Ikhtisar-Keuangan",
        CASH_BOOK: "Buku-Kas-Umum",
        DUES: "Rekapitulasi-Iuran",
        FINES: "Rekap-Denda-Alpa",
        DONATIONS: "Rekapitulasi-Donasi",
        ADMIN: "Administrasi-Keanggotaan",
      };
      const cleanDate = formatDate(new Date()).replace(/\s+/g, "-");
      const fileName = `Laporan-${tabTitleMap[tab]}-${cleanDate}`;

      await downloadElementAsPdf(reportContainerRef.current, {
        filename: fileName,
        orientation: tab === "CASH_BOOK" || tab === "DUES" || tab === "FINES" ? "landscape" : "portrait",
      });
    } catch (err: any) {
      console.error("Gagal membuat PDF laporan:", err);
      alert(err?.message || "Gagal membuat berkas PDF. Silakan coba kembali.");
    } finally {
      setIsDownloading(false);
    }
  };

  // CSV / Excel Export action
  const handleExportCsv = () => {
    let csvContent = "\uFEFF";
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (tab === "CASH_BOOK") {
      csvContent += "No,Tanggal,No Referensi,Uraian Transaksi,Pihak Terkait,Kategori,Pemasukan (Debit),Pengeluaran (Kredit),Saldo Berjalan\n";
      filteredTransactions.forEach((tx, idx) => {
        const debit = tx.type === "PEMASUKAN" ? tx.amountNum : 0;
        const kredit = tx.type === "PENGELUARAN" ? tx.amountNum : 0;
        csvContent += `"${idx + 1}","${formatDate(tx.date)}","${tx.referenceNo || "-"}","${(tx.title || "").replace(/"/g, '""')}","${(tx.sourceOrRecipient || "-").replace(/"/g, '""')}","${tx.category?.name || "-"}","${debit}","${kredit}","${tx.runningBalance}"\n`;
      });
      triggerDownloadCsv(csvContent, `Buku-Kas-Umum-${dateStamp}.csv`);
    } else if (tab === "DUES") {
      csvContent += "No,Nama Anggota,Regu,Jenis Iuran,Periode,Kewajiban Tagihan,Terbayar,Sisa,Status,Tgl Pembayaran\n";
      filteredDues.forEach((d, idx) => {
        const memberName = d.member?.fullName || d.member?.name || "Anggota";
        const groupName = d.member?.group?.name || "-";
        const duesType = d.duesType?.name || "Iuran";
        const amount = Number(d.amount) || 0;
        const paid = Number(d.amountPaid) || 0;
        const sisa = amount - paid;
        csvContent += `"${idx + 1}","${memberName}","${groupName}","${duesType}","${d.periodName || "-"}","${amount}","${paid}","${sisa}","${d.status}","${d.paidAt ? formatDate(d.paidAt) : "-"}"\n`;
      });
      triggerDownloadCsv(csvContent, `Rekap-Iuran-Anggota-${dateStamp}.csv`);
    } else if (tab === "FINES") {
      csvContent += "No,Nama Anggota,Regu,Keterangan Alpa,Tarif Denda,Terbayar,Sisa Tagihan,Status,Tgl Pelunasan\n";
      filteredFines.forEach((f, idx) => {
        const memberName = f.member?.fullName || f.member?.name || "Anggota";
        const groupName = f.member?.group?.name || "-";
        const amount = Number(f.amount) || 0;
        const paid = Number(f.amountPaid) || 0;
        const sisa = amount - paid;
        csvContent += `"${idx + 1}","${memberName}","${groupName}","${f.periodName || "Denda Alpa"}","${amount}","${paid}","${sisa}","${f.status}","${f.paidAt ? formatDate(f.paidAt) : "-"}"\n`;
      });
      triggerDownloadCsv(csvContent, `Rekap-Denda-Alpa-${dateStamp}.csv`);
    } else if (tab === "DONATIONS") {
      csvContent += "No,No Donasi,Tanggal,Nama Donatur,Kampanye / Peruntukan,Metode,Nominal,Status\n";
      filteredDonations.forEach((don, idx) => {
        csvContent += `"${idx + 1}","${don.donationNumber}","${formatDate(don.createdAt)}","${don.donorName}","${don.campaign?.title || "Umum"}","${don.paymentMethod}","${Number(don.amount)}","${don.status}"\n`;
      });
      triggerDownloadCsv(csvContent, `Rekap-Donasi-${dateStamp}.csv`);
    } else {
      csvContent += "Pos Keuangan,Nominal\n";
      csvContent += `"Saldo Awal Kas","${initialBalance}"\n`;
      csvContent += `"Total Pemasukan","${overallTotals.totalIncome}"\n`;
      csvContent += `"Total Pengeluaran","${overallTotals.totalExpense}"\n`;
      csvContent += `"Saldo Kas Akhir","${overallTotals.currentBalance}"\n`;
      triggerDownloadCsv(csvContent, `Ringkasan-Keuangan-${dateStamp}.csv`);
    }
  };

  const triggerDownloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabTitles: Record<TabType, string> = {
    OVERVIEW: "LAPORAN IKHTISAR KEUANGAN & ARUS KAS",
    CASH_BOOK: "BUKU KAS UMUM (JURNAL TRANSAKSI KEUANGAN)",
    DUES: "LAPORAN REKAPITULASI IURAN ANGGOTA",
    FINES: "LAPORAN REKAPITULASI DENDA ABSENSI / ALPA",
    DONATIONS: "LAPORAN REKAPITULASI DONASI & BANTUAN",
    ADMIN: "LAPORAN REKAPITULASI ADMINISTRASI KEANGGOTAAN",
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: GLOSSY EMERALD DARK BACKDROP WITH AMBIENT GLOW            */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#061c14] via-[#0b281d] to-[#04130d] p-6 sm:p-8 text-white border border-emerald-500/20 shadow-2xl print:hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 right-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/70 border border-emerald-500/30 backdrop-blur-md text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Sistem Pelaporan Keuangan & Kas Pangkalan</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Laporan Keuangan Terpadu
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Buku kas umum, rekapitulasi iuran anggota, pelaporan denda alpa latihan, donasi, serta ikhtisar keuangan resmi pangkalan {orgPangkalan}.
            </p>
          </div>

          {/* Quick Action Export Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* View Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "DASHBOARD" ? "PRINT_PREVIEW" : "DASHBOARD")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Ganti antara mode dashboard interaktif dan pratinjau lembar cetak A4 formal"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-300" />
              <span>{viewMode === "DASHBOARD" ? "Pratinjau Lembar Cetak" : "Mode Dashboard"}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-md border border-white/15 transition-all cursor-pointer active:scale-95"
              title="Ekspor data tabel aktif ke format Microsoft Excel / CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-scout-950 font-black text-xs transition-all shadow-md cursor-pointer active:scale-95 disabled:opacity-60"
              title="Unduh dokumen PDF resmi langsung ke perangkat"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all shadow-md cursor-pointer active:scale-95"
              title="Cetak langsung menggunakan printer fisik"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak Fisik</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TAB NAVIGATION & PERIOD FILTER CONTROLS (Print Hidden)                  */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-2xs space-y-4 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {canViewFinance && (
            <>
              <button
                type="button"
                onClick={() => setTab("OVERVIEW")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === "OVERVIEW"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Ikhtisar Keuangan</span>
              </button>

              <button
                type="button"
                onClick={() => setTab("CASH_BOOK")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === "CASH_BOOK"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Buku Kas Umum</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === "CASH_BOOK" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {filteredTransactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("DUES")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === "DUES"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Rekap Iuran</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === "DUES" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {filteredDues.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTab("FINES")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === "FINES"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Rekap Denda Alpa</span>
                {finesList.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === "FINES" ? "bg-amber-400 text-amber-950" : "bg-amber-100 text-amber-800"}`}>
                    {finesList.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setTab("DONATIONS")}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tab === "DONATIONS"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
                }`}
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Rekap Donasi</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === "DONATIONS" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {filteredDonations.length}
                </span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setTab("ADMIN")}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              tab === "ADMIN"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Administrasi Anggota</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${tab === "ADMIN" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
              {members.length}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Period selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Periode:</span>
            </span>

            {(["THIS_MONTH", "LAST_MONTH", "THIS_YEAR", "ALL", "CUSTOM"] as PeriodType[]).map((p) => {
              const labelMap: Record<PeriodType, string> = {
                THIS_MONTH: "Bulan Ini",
                LAST_MONTH: "Bulan Lalu",
                THIS_YEAR: "Tahun Ini",
                ALL: "Semua",
                CUSTOM: "Kustom",
              };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    period === p
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {labelMap[p]}
                </button>
              );
            })}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi, anggota, regu..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Custom date range picker if CUSTOM is selected */}
        {period === "CUSTOM" && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
            <span className="font-bold text-emerald-950">Rentang Tanggal:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Dari:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Sampai:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 focus:outline-emerald-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MODE 1: MODERN INTERACTIVE DASHBOARD VIEW (When viewMode === DASHBOARD) */}
      {/* ========================================================================= */}
      {viewMode === "DASHBOARD" && (
        <div className="space-y-6 print:hidden">
          {/* TOP 4 STATS CARDS */}
          {canViewFinance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Saldo Kas Bersih Saat Ini */}
              <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#0c2e22] via-[#092218] to-slate-900 text-white border border-emerald-500/20 shadow-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Saldo Kas Bersih
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatRupiah(overallTotals.currentBalance)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-emerald-200/80 pt-1 border-t border-white/10">
                  <span>Saldo Awal: {formatRupiah(initialBalance)}</span>
                  <span className="font-bold text-emerald-400">● Likuiditas Kas</span>
                </div>
              </div>

              {/* Card 2: Pemasukan Kas Periode Terpilih */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pemasukan ({period === "THIS_MONTH" ? "Bulan Ini" : period === "THIS_YEAR" ? "Tahun Ini" : "Periode"})
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  {formatRupiah(periodIncome)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Total Masuk Riil: <strong className="text-slate-600">{formatRupiah(overallTotals.totalIncome)}</strong>
                </p>
              </div>

              {/* Card 3: Pengeluaran Kas Periode Terpilih */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Pengeluaran ({period === "THIS_MONTH" ? "Bulan Ini" : period === "THIS_YEAR" ? "Tahun Ini" : "Periode"})
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-rose-700 tracking-tight">
                  {formatRupiah(periodExpense)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Total Keluar Riil: <strong className="text-slate-600">{formatRupiah(overallTotals.totalExpense)}</strong>
                </p>
              </div>

              {/* Card 4: Denda & Iuran Terkumpul */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Denda Alpa Terkumpul
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                  {formatRupiah(finesCollected)}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>{finesLunasCount} denda lunas</span>
                  <span className="text-amber-700 font-bold">{finesBelumCount} belum bayar</span>
                </div>
              </div>
            </div>
          )}

          {/* VISUAL CASH PROPORTION PROGRESS BAR (OVERVIEW TAB) */}
          {tab === "OVERVIEW" && canViewFinance && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Komposisi Sumber Penerimaan Kas Pangkalan</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proporsi realisasi kas masuk dari iuran, denda alpa presensi, dan donasi terverifikasi.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
                  Total Terhimpun: {formatRupiah(incomeBreakdown.totalAllInflow)}
                </span>
              </div>

              {/* Visual Multi-Segment Bar */}
              <div className="space-y-2">
                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${incomeBreakdown.duesPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-500"
                    title={`Iuran: ${incomeBreakdown.duesPct}%`}
                  />
                  <div
                    style={{ width: `${incomeBreakdown.finesPct}%` }}
                    className="bg-amber-500 h-full transition-all duration-500"
                    title={`Denda Alpa: ${incomeBreakdown.finesPct}%`}
                  />
                  <div
                    style={{ width: `${incomeBreakdown.donPct}%` }}
                    className="bg-blue-500 h-full transition-all duration-500"
                    title={`Donasi: ${incomeBreakdown.donPct}%`}
                  />
                </div>

                {/* Legend Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-950">Iuran Anggota</p>
                        <p className="text-[10px] text-emerald-700">{incomeBreakdown.duesPct}% dari total</p>
                      </div>
                    </div>
                    <span className="font-black text-xs sm:text-sm text-emerald-800">
                      {formatRupiah(duesCollected)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-950">Denda Alpa Latihan</p>
                        <p className="text-[10px] text-amber-700">{incomeBreakdown.finesPct}% dari total</p>
                      </div>
                    </div>
                    <span className="font-black text-xs sm:text-sm text-amber-800">
                      {formatRupiah(finesCollected)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-md bg-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-950">Donasi & Bantuan</p>
                        <p className="text-[10px] text-blue-700">{incomeBreakdown.donPct}% dari total</p>
                      </div>
                    </div>
                    <span className="font-black text-xs sm:text-sm text-blue-800">
                      {formatRupiah(totalDonationsVerified)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT TABLES (MODERN INTERACTIVE CARD TABLES) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span>{tabTitles[tab]}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Data periode <strong>{dateRange.label}</strong>
                </p>
              </div>

              {/* Tab specific filter chips */}
              {tab === "CASH_BOOK" && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setTxTypeFilter("ALL")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${txTypeFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTypeFilter("PEMASUKAN")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${txTypeFilter === "PEMASUKAN" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                  >
                    + Pemasukan
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTypeFilter("PENGELUARAN")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${txTypeFilter === "PENGELUARAN" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-800 hover:bg-rose-100"}`}
                  >
                    - Pengeluaran
                  </button>
                </div>
              )}

              {(tab === "DUES" || tab === "FINES") && (
                <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${statusFilter === "ALL" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("LUNAS")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${statusFilter === "LUNAS" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                  >
                    Lunas
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("BELUM_LUNAS")}
                    className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${statusFilter === "BELUM_LUNAS" ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-800 hover:bg-amber-100"}`}
                  >
                    Belum Lunas
                  </button>
                </div>
              )}
            </div>

            {/* Render table based on active tab */}
            {tab === "CASH_BOOK" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">No. Bukti</th>
                      <th className="p-3">Uraian Transaksi</th>
                      <th className="p-3">Kategori</th>
                      <th className="p-3 text-right">Debit (Masuk)</th>
                      <th className="p-3 text-right">Kredit (Keluar)</th>
                      <th className="p-3 text-right">Saldo Berjalan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx, idx) => {
                      const isInc = tx.type === "PEMASUKAN";
                      return (
                        <tr key={tx.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 whitespace-nowrap font-medium text-slate-800">
                            {formatDate(tx.date)}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-500 font-bold">
                            {tx.referenceNo || "-"}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{tx.title}</p>
                            {tx.sourceOrRecipient && (
                              <p className="text-[10px] text-slate-500 mt-0.5">Pihak: {tx.sourceOrRecipient}</p>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {tx.category?.name || "Lain-lain"}
                            </span>
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {isInc ? `+${formatRupiah(tx.amountNum)}` : "-"}
                          </td>
                          <td className="p-3 text-right font-bold text-rose-700">
                            {!isInc ? `-${formatRupiah(tx.amountNum)}` : "-"}
                          </td>
                          <td className="p-3 text-right font-black font-mono text-slate-900 bg-slate-50/50">
                            {formatRupiah(tx.runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          Tidak ada catatan transaksi kas pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredTransactions.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-black text-slate-900 text-xs">
                        <td colSpan={5} className="p-3 text-right uppercase">
                          Subtotal Periode Terpilih:
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-black">
                          {formatRupiah(periodIncome)}
                        </td>
                        <td className="p-3 text-right text-rose-700 font-black">
                          {formatRupiah(periodExpense)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-900">
                          {formatRupiah(periodIncome - periodExpense)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {tab === "DUES" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Nama Lengkap Anggota</th>
                      <th className="p-3">Regu / Sangga</th>
                      <th className="p-3">Jenis Iuran</th>
                      <th className="p-3 text-right">Kewajiban</th>
                      <th className="p-3 text-right">Terbayar</th>
                      <th className="p-3 text-right">Sisa</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Tgl Bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDues.map((d, idx) => {
                      const memberName = d.member?.fullName || d.member?.name || "Anggota";
                      const groupName = d.member?.group?.name || "-";
                      const isLunas = d.status === "LUNAS";
                      const amount = Number(d.amount) || 0;
                      const paid = Number(d.amountPaid) || 0;
                      const sisa = amount - paid;

                      return (
                        <tr key={d.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{memberName}</td>
                          <td className="p-3 text-slate-600">{groupName}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{d.duesType?.name || "Iuran"}</p>
                            <p className="text-[10px] text-slate-400">{d.periodName || "-"}</p>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            {formatRupiah(amount)}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {formatRupiah(paid)}
                          </td>
                          <td className="p-3 text-right font-bold text-amber-700">
                            {sisa > 0 ? formatRupiah(sisa) : "-"}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isLunas
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isLunas ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <span>{d.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">
                            {d.paidAt ? formatDate(d.paidAt) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredDues.length === 0 && (
                      <tr>
                        <td colSpan={9} className="p-8 text-center text-slate-400 italic">
                          Tidak ada catatan iuran pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "FINES" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">Nama Anggota</th>
                      <th className="p-3">Regu / Sangga</th>
                      <th className="p-3">Keterangan Latihan (Alpa)</th>
                      <th className="p-3 text-right">Tarif Denda</th>
                      <th className="p-3 text-right">Terbayar</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3">Tgl Pelunasan Kas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredFines.map((f, idx) => {
                      const memberName = f.member?.fullName || f.member?.name || "Anggota";
                      const groupName = f.member?.group?.name || "-";
                      const isLunas = f.status === "LUNAS";
                      const amount = Number(f.amount) || 0;
                      const paid = Number(f.amountPaid) || 0;

                      return (
                        <tr key={f.id || idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">{memberName}</td>
                          <td className="p-3 text-slate-600">{groupName}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{f.periodName || "Denda Alpa"}</p>
                            {f.notes && (
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{f.notes}</p>
                            )}
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">
                            {formatRupiah(amount)}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-700">
                            {formatRupiah(paid)}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isLunas
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border-amber-200"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isLunas ? "bg-emerald-500" : "bg-amber-500"}`} />
                              <span>{f.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 text-[11px]">
                            {f.paidAt ? formatDate(f.paidAt) : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredFines.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          Tidak ada catatan denda alpa pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "DONATIONS" && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                      <th className="p-3 w-10 text-center">No</th>
                      <th className="p-3">No. Donasi</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Nama Donatur</th>
                      <th className="p-3">Kampanye / Peruntukan</th>
                      <th className="p-3">Metode</th>
                      <th className="p-3 text-right">Nominal</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDonations.map((don, idx) => (
                      <tr key={don.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-slate-700">{don.donationNumber}</td>
                        <td className="p-3 text-slate-600">{formatDate(don.createdAt)}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {don.isAnonymous ? "Hamba Allah (Anonim)" : don.donorName}
                        </td>
                        <td className="p-3 text-slate-700">{don.campaign?.title || "Umum Pangkalan"}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {don.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700">
                          {formatRupiah(Number(don.amount))}
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>{don.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredDonations.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                          Belum ada catatan donasi pada filter ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "ADMIN" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                    Daftar Regu / Sangga Terdaftar
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <th className="p-2.5">Nama Regu</th>
                          <th className="p-2.5">Kategori</th>
                          <th className="p-2.5 text-right">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {groups.map((g) => (
                          <tr key={g.id}>
                            <td className="p-2.5 font-bold text-slate-900">{g.name}</td>
                            <td className="p-2.5 text-slate-600">{g.category}</td>
                            <td className="p-2.5 text-right font-black text-emerald-700">
                              {g._count?.members || 0} orang
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
                    Komposisi Golongan Tingkatan
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                          <th className="p-2.5">Tingkatan Pramuka</th>
                          <th className="p-2.5 text-right">Jumlah Anggota</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(levelStats).map(([lvl, count]) => (
                          <tr key={lvl}>
                            <td className="p-2.5 font-bold text-slate-900">{lvl}</td>
                            <td className="p-2.5 text-right font-black text-emerald-700">
                              {count} orang
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODE 2: FORMAL PRINT SHEET (Visible when PRINT_PREVIEW or when printing) */}
      {/* ========================================================================= */}
      <div
        ref={reportContainerRef}
        id="printable-official-reports"
        className={`${
          viewMode === "PRINT_PREVIEW" ? "block" : "hidden"
        } print:block bg-white rounded-3xl border border-slate-300 p-6 sm:p-12 space-y-6 shadow-xl print:border-none print:shadow-none print:p-0 print:m-0`}
      >
        {/* KOP SURAT FORMAL RESMI */}
        <div className="border-b-4 border-double border-slate-900 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="w-20 h-20 shrink-0 flex items-center justify-center p-1 bg-white border border-slate-200 rounded-2xl">
              <img
                src={orgLogo}
                alt="Logo Pangkalan"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            <div className="flex-1 text-center font-sans space-y-0.5">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                GERAKAN PRAMUKA GUGUS DEPAN
              </h3>
              <h1 className="text-base sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
                {orgName} • {orgPangkalan}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-600 max-w-xl mx-auto">
                {orgAddress}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                Sistem Administrasi Terpadu & Pembukuan Keuangan Resmi Gugus Depan
              </p>
            </div>

            <div className="w-20 h-20 shrink-0 hidden sm:flex items-center justify-center p-1 bg-white border border-slate-200 rounded-2xl">
              <img
                src="/logo.jpeg"
                alt="Lambang Pramuka"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          </div>

          <div className="border-t border-slate-300 mt-4 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-600">
            <div>
              <span className="font-black text-slate-900 uppercase tracking-wide">
                {tabTitles[tab]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Periode: <strong className="text-slate-800">{dateRange.label}</strong></span>
              <span>•</span>
              <span>Dicetak: <strong>{formatDate(new Date())}</strong></span>
            </div>
          </div>
        </div>

        {/* PRINT CONTENT: SUMMARY TABLE */}
        {tab === "OVERVIEW" && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 border border-slate-300 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Saldo Awal</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(initialBalance)}</p>
              </div>
              <div className="p-3 border border-slate-300 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Pemasukan Periode</span>
                <p className="text-sm font-black text-emerald-800 mt-0.5">{formatRupiah(periodIncome)}</p>
              </div>
              <div className="p-3 border border-slate-300 rounded-xl">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Pengeluaran Periode</span>
                <p className="text-sm font-black text-rose-800 mt-0.5">{formatRupiah(periodExpense)}</p>
              </div>
              <div className="p-3 border border-slate-300 rounded-xl bg-slate-50">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Saldo Kas Akhir</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{formatRupiah(overallTotals.currentBalance)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs uppercase text-slate-700">Rincian Pos Pengeluaran per Kategori</h4>
              <table className="w-full text-xs text-left border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                    <th className="p-2 border-r border-slate-300">Kategori</th>
                    <th className="p-2 border-r border-slate-300">Jenis</th>
                    <th className="p-2 text-right">Akumulasi Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overallTotals.categories
                    .filter((c) => c.type === "PENGELUARAN")
                    .map((cat, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-slate-200 font-medium">{cat.name}</td>
                        <td className="p-2 border-r border-slate-200">PENGELUARAN</td>
                        <td className="p-2 text-right font-bold text-slate-900">{formatRupiah(cat.total)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PRINT CONTENT: CASH BOOK TABLE */}
        {tab === "CASH_BOOK" && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                  <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                  <th className="p-2 border-r border-slate-300">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">No. Bukti</th>
                  <th className="p-2 border-r border-slate-300">Uraian Transaksi</th>
                  <th className="p-2 border-r border-slate-300">Kategori</th>
                  <th className="p-2 text-right border-r border-slate-300">Debit (Masuk)</th>
                  <th className="p-2 text-right border-r border-slate-300">Kredit (Keluar)</th>
                  <th className="p-2 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTransactions.map((tx, idx) => (
                  <tr key={tx.id || idx}>
                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{tx.referenceNo || "-"}</td>
                    <td className="p-2 border-r border-slate-200 font-medium">{tx.title}</td>
                    <td className="p-2 border-r border-slate-200 text-[10px]">{tx.category?.name || "-"}</td>
                    <td className="p-2 text-right border-r border-slate-200 font-bold">
                      {tx.type === "PEMASUKAN" ? formatRupiah(tx.amountNum) : "-"}
                    </td>
                    <td className="p-2 text-right border-r border-slate-200 font-bold">
                      {tx.type === "PENGELUARAN" ? formatRupiah(tx.amountNum) : "-"}
                    </td>
                    <td className="p-2 text-right font-black font-mono">{formatRupiah(tx.runningBalance)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-xs">
                  <td colSpan={5} className="p-2 text-right uppercase">Total:</td>
                  <td className="p-2 text-right">{formatRupiah(periodIncome)}</td>
                  <td className="p-2 text-right">{formatRupiah(periodExpense)}</td>
                  <td className="p-2 text-right font-mono">{formatRupiah(periodIncome - periodExpense)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* PRINT CONTENT: DUES TABLE */}
        {tab === "DUES" && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                  <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Anggota</th>
                  <th className="p-2 border-r border-slate-300">Regu</th>
                  <th className="p-2 border-r border-slate-300">Jenis & Periode</th>
                  <th className="p-2 text-right border-r border-slate-300">Kewajiban</th>
                  <th className="p-2 text-right border-r border-slate-300">Terbayar</th>
                  <th className="p-2 text-center border-r border-slate-300">Status</th>
                  <th className="p-2">Tgl Bayar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDues.map((d, idx) => (
                  <tr key={d.id || idx}>
                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-medium">{d.member?.fullName || d.member?.name || "Anggota"}</td>
                    <td className="p-2 border-r border-slate-200">{d.member?.group?.name || "-"}</td>
                    <td className="p-2 border-r border-slate-200">{d.duesType?.name} ({d.periodName})</td>
                    <td className="p-2 text-right border-r border-slate-200">{formatRupiah(Number(d.amount))}</td>
                    <td className="p-2 text-right border-r border-slate-200 font-bold">{formatRupiah(Number(d.amountPaid))}</td>
                    <td className="p-2 text-center border-r border-slate-200 font-bold text-[10px]">{d.status}</td>
                    <td className="p-2 text-[10px]">{d.paidAt ? formatDate(d.paidAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PRINT CONTENT: FINES TABLE */}
        {tab === "FINES" && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                  <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                  <th className="p-2 border-r border-slate-300">Nama Anggota</th>
                  <th className="p-2 border-r border-slate-300">Regu</th>
                  <th className="p-2 border-r border-slate-300">Pertemuan Latihan (Alpa)</th>
                  <th className="p-2 text-right border-r border-slate-300">Tarif Denda</th>
                  <th className="p-2 text-right border-r border-slate-300">Terbayar</th>
                  <th className="p-2 text-center border-r border-slate-300">Status</th>
                  <th className="p-2">Tgl Pelunasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFines.map((f, idx) => (
                  <tr key={f.id || idx}>
                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-medium">{f.member?.fullName || f.member?.name || "Anggota"}</td>
                    <td className="p-2 border-r border-slate-200">{f.member?.group?.name || "-"}</td>
                    <td className="p-2 border-r border-slate-200">{f.periodName || "Denda Alpa"}</td>
                    <td className="p-2 text-right border-r border-slate-200">{formatRupiah(Number(f.amount))}</td>
                    <td className="p-2 text-right border-r border-slate-200 font-bold">{formatRupiah(Number(f.amountPaid))}</td>
                    <td className="p-2 text-center border-r border-slate-200 font-bold text-[10px]">{f.status}</td>
                    <td className="p-2 text-[10px]">{f.paidAt ? formatDate(f.paidAt) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PRINT CONTENT: DONATIONS TABLE */}
        {tab === "DONATIONS" && (
          <div className="space-y-3">
            <table className="w-full text-xs text-left border border-slate-300 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[10px] uppercase">
                  <th className="p-2 w-8 text-center border-r border-slate-300">No</th>
                  <th className="p-2 border-r border-slate-300">No. Donasi</th>
                  <th className="p-2 border-r border-slate-300">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Nama Donatur</th>
                  <th className="p-2 border-r border-slate-300">Kampanye</th>
                  <th className="p-2 border-r border-slate-300">Metode</th>
                  <th className="p-2 text-right border-r border-slate-300">Nominal</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDonations.map((don, idx) => (
                  <tr key={don.id || idx}>
                    <td className="p-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">{don.donationNumber}</td>
                    <td className="p-2 border-r border-slate-200">{formatDate(don.createdAt)}</td>
                    <td className="p-2 border-r border-slate-200 font-medium">{don.donorName}</td>
                    <td className="p-2 border-r border-slate-200">{don.campaign?.title || "Umum"}</td>
                    <td className="p-2 border-r border-slate-200">{don.paymentMethod}</td>
                    <td className="p-2 text-right border-r border-slate-200 font-bold">{formatRupiah(Number(don.amount))}</td>
                    <td className="p-2 text-center font-bold text-[10px]">{don.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FORMAL SIGNATURE BLOCK FOR OFFICIAL PRINTED/PDF REPORT */}
        <div className="pt-8 mt-6 border-t-2 border-slate-300 font-sans">
          <p className="text-right text-xs text-slate-500 mb-4">
            Ditetapkan di {orgPangkalan}, pada tanggal {formatDate(new Date())}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs">
            {/* 1. Mengetahui: Ketua Gugus Depan */}
            <div className="flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-500 font-medium">Mengetahui,</p>
                <p className="font-bold text-slate-900">Ketua Gugus Depan</p>
              </div>
              <div>
                <p className="font-black underline text-slate-900">{kaGudepName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  NTA: {kaGudepNip || "Pangkalan Pramuka"}
                </p>
              </div>
            </div>

            {/* 2. Menyetujui: Ketua Mabigus */}
            <div className="hidden sm:flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-500 font-medium">Menyetujui,</p>
                <p className="font-bold text-slate-900">Ketua Mabigus</p>
              </div>
              <div>
                <p className="font-black underline text-slate-900">{mabigusName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  NTA/NIP: {mabigusNip || "Majelis Pembimbing"}
                </p>
              </div>
            </div>

            {/* 3. Dibuat Oleh: Bendahara Gugus Depan */}
            <div className="flex flex-col justify-between h-36">
              <div>
                <p className="text-slate-500 font-medium">Dibuat & Diverifikasi,</p>
                <p className="font-bold text-slate-900">
                  {tab === "ADMIN" ? "Sekretaris Gugus Depan" : "Bendahara Gugus Depan"}
                </p>
              </div>
              <div>
                <p className="font-black underline text-slate-900">{bendaharaName}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  NTA: {bendaharaNip || "Pengurus Keuangan"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
