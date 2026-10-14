import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BendaharaDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "BENDAHARA" && session.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let initialBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let recentTransactions: any[] = [];
  let duesPaidCount = 0;
  let duesPendingCount = 0;

  try {
    const profile = await prisma.organizationProfile.findFirst();
    initialBalance = profile?.initialBalance ? Number(profile.initialBalance) : 0;

    const txs = await prisma.financialTransaction.findMany({
      where: { status: "VALID" },
      select: { type: true, amount: true },
    });

    txs.forEach((t) => {
      const amt = Number(t.amount);
      if (t.type === "PEMASUKAN") totalIncome += amt;
      else if (t.type === "PENGELUARAN") totalExpense += amt;
    });

    recentTransactions = await prisma.financialTransaction.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { category: true },
    });

    const [paid, pending] = await Promise.all([
      prisma.memberDues.count({ where: { status: "LUNAS" } }),
      prisma.memberDues.count({ where: { status: "BELUM_LUNAS" } }),
    ]);
    duesPaidCount = paid;
    duesPendingCount = pending;
  } catch {
    // fallback
  }

  const currentBalance = initialBalance + totalIncome - totalExpense;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-scout-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
            <span>Portal Kebendaharaan</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard Keuangan — {session.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Kelola pembukuan kas pangkalan, pencatatan iuran wajib anggota, verifikasi bukti transaksi, dan laporan saldo.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/finance"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-scout-950 text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Entri Transaksi</span>
          </Link>
          <Link
            href="/dashboard/dues"
            className="px-3.5 py-2 rounded-xl bg-scout-800 hover:bg-scout-700 text-white text-xs font-bold border border-scout-600 inline-flex items-center gap-1.5 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Iuran Anggota</span>
          </Link>
          <Link
            href="/dashboard/reports"
            className="px-3.5 py-2 rounded-xl bg-scout-800 hover:bg-scout-700 text-white text-xs font-bold border border-scout-600 inline-flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Laporan Kas</span>
          </Link>
        </div>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Current Balance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Bersih</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{formatRupiah(currentBalance)}</p>
          <p className="text-xs text-slate-500">
            Saldo Awal: {formatRupiah(initialBalance)}
          </p>
        </div>

        {/* Total Income */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pemasukan</span>
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-700">{formatRupiah(totalIncome)}</p>
          <p className="text-xs text-slate-500">Dari iuran anggota, sumbangan, & kas</p>
        </div>

        {/* Total Expense */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Pengeluaran</span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-700">{formatRupiah(totalExpense)}</p>
          <p className="text-xs text-slate-500">Kegiatan, perlengkapan, konsumsi</p>
        </div>
      </div>

      {/* Dues Status & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Iuran Summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Status Iuran Anggota</h2>
            <p className="text-xs text-slate-500">Rekapitulasi pembayaran kewajiban anggota</p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800">Iuran Lunas</p>
                <p className="text-xl font-black text-emerald-900 mt-1">{duesPaidCount}</p>
              </div>
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-800">Menunggu Pembayaran</p>
                <p className="text-xl font-black text-amber-900 mt-1">{duesPendingCount}</p>
              </div>
              <Clock className="w-7 h-7 text-amber-600" />
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard/dues"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Kelola Tagihan & Iuran</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Riwayat Transaksi Terbaru</h2>
              <p className="text-xs text-slate-500">Catatan pembukuan kas terakhir</p>
            </div>
            <Link
              href="/dashboard/finance"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Buku Kas Lengkap &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-xs ${
                        tx.type === "PEMASUKAN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {tx.type === "PEMASUKAN" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">{tx.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {tx.category?.name} • {formatDate(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-black text-sm ${
                      tx.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {tx.type === "PEMASUKAN" ? "+" : "-"}
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada transaksi tercatat di kas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
