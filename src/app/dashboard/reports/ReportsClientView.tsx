"use client";

import React, { useState, useMemo } from "react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { Printer, Download, Users, Wallet, CreditCard, Filter } from "lucide-react";

interface ReportsClientViewProps {
  members: any[];
  groups: any[];
  transactions: any[];
  categories: any[];
  duesList: any[];
  initialBalance: number;
  canViewFinance: boolean;
}

export function ReportsClientView({
  members,
  groups,
  transactions,
  categories,
  duesList,
  initialBalance,
  canViewFinance,
}: ReportsClientViewProps) {
  const [tab, setTab] = useState<"ADMIN" | "FINANCE" | "DUES">("ADMIN");

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

    return { totalBilled, totalCollected, outstanding: totalBilled - totalCollected, pendingCount };
  }, [duesList]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Laporan Resmi Gugus Depan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekapitulasi administrasi keanggotaan dan pembukuan keuangan pangkalan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Selectors */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab("ADMIN")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                tab === "ADMIN" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
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
                    tab === "FINANCE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Arus Kas
                </button>
                <button
                  type="button"
                  onClick={() => setTab("DUES")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    tab === "DUES" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Rekap Iuran
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
        <h2 className="text-xl font-black uppercase tracking-tight">GERAKAN PRAMUKA GUGUS DEPAN</h2>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">MH SCOUT PANGKALAN SEKOLAH</h3>
        <p className="text-xs text-slate-500 mt-1">Dicetak pada: {formatDate(new Date())}</p>
      </div>

      {/* 1. TAB: ADMINISTRASI */}
      {tab === "ADMIN" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Rekap Regu */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base">Rekap Anggota per Regu / Sangga</h3>
              
              {/* Mobile View */}
              <div className="sm:hidden space-y-2">
                {groups.map((g) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{g.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{g.category}</p>
                    </div>
                    <span className="font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                      {g._count?.members || 0} orang
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                      <th className="p-2.5">Nama Regu</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5 text-right">Jumlah Anggota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groups.map((g) => (
                      <tr key={g.id}>
                        <td className="p-2.5 font-bold text-slate-900">{g.name}</td>
                        <td className="p-2.5 text-slate-600">{g.category}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">
                          {g._count?.members || 0} orang
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rekap Tingkatan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base">Rekap Tingkatan Golongan</h3>

              {/* Mobile View */}
              <div className="sm:hidden space-y-2">
                {Object.entries(levelStats).map(([lvl, count]) => (
                  <div key={lvl} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs">
                    <p className="font-bold text-slate-900">{lvl}</p>
                    <span className="font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                      {count} orang
                    </span>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                      <th className="p-2.5">Tingkatan Pramuka</th>
                      <th className="p-2.5 text-right">Jumlah Anggota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(levelStats).map(([lvl, count]) => (
                      <tr key={lvl}>
                        <td className="p-2.5 font-bold text-slate-900">{lvl}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-700">{count} orang</td>
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Saldo Awal</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(initialBalance)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Pemasukan</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(financeSummary.income)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Pengeluaran</span>
              <p className="text-xl font-black text-rose-700 mt-1">{formatRupiah(financeSummary.expense)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-base">Rincian Per Kategori Transaksi</h3>

            {/* Mobile View */}
            <div className="sm:hidden space-y-2">
              {financeSummary.catList.map((cat, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{cat.name}</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                      cat.type === "PEMASUKAN" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {cat.type}
                    </span>
                  </div>
                  <span
                    className={`font-black text-xs ${
                      cat.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatRupiah(cat.total)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                    <th className="p-2.5">Kategori</th>
                    <th className="p-2.5">Jenis</th>
                    <th className="p-2.5 text-right">Total Akumulasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financeSummary.catList.map((cat, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-slate-900">{cat.name}</td>
                      <td className="p-2.5 text-slate-600">{cat.type}</td>
                      <td
                        className={`p-2.5 text-right font-black ${
                          cat.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Ditagihkan</span>
              <p className="text-xl font-black text-slate-900 mt-1">{formatRupiah(duesSummary.totalBilled)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Terkumpul</span>
              <p className="text-xl font-black text-emerald-700 mt-1">{formatRupiah(duesSummary.totalCollected)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tunggakan</span>
              <p className="text-xl font-black text-amber-700 mt-1">{formatRupiah(duesSummary.outstanding)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
