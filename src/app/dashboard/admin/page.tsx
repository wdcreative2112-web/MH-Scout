import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  Users,
  Shield,
  Award,
  Wallet,
  Calendar,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity as ActivityIcon,
  PlusCircle,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Live queries
  let membersCount = 0;
  let groupsCount = 0;
  let leadersCount = 0;
  let initialBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let recentTransactions: any[] = [];
  let recentMembers: any[] = [];
  let upcomingMeetings: any[] = [];
  let recentAudits: any[] = [];

  try {
    const profile = await prisma.organizationProfile.findFirst();
    initialBalance = profile?.initialBalance ? Number(profile.initialBalance) : 0;

    const [mCount, gCount, lCount] = await Promise.all([
      prisma.member.count({ where: { status: "AKTIF" } }),
      prisma.scoutGroup.count({ where: { isActive: true } }),
      prisma.leader.count({ where: { isActive: true } }),
    ]);
    membersCount = mCount;
    groupsCount = gCount;
    leadersCount = lCount;

    // Financial totals
    const transactions = await prisma.financialTransaction.findMany({
      where: { status: "VALID" },
      select: { type: true, amount: true },
    });

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "PEMASUKAN") totalIncome += amt;
      else if (tx.type === "PENGELUARAN") totalExpense += amt;
    });

    recentTransactions = await prisma.financialTransaction.findMany({
      take: 4,
      orderBy: { date: "desc" },
      include: { category: true },
    });

    recentMembers = await prisma.member.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { group: true },
    });

    upcomingMeetings = await prisma.attendanceMeeting.findMany({
      take: 3,
      orderBy: { meetingDate: "desc" },
      include: {
        _count: { select: { records: true } },
      },
    });

    recentAudits = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB error fallback
  }

  const currentBalance = initialBalance + totalIncome - totalExpense;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-scout-950 via-scout-900 to-scout-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 text-xs font-bold border border-emerald-800">
            <span>Administrator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Selamat Datang, {session.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Berikut adalah ringkasan operasional kepramukaan, status kehadiran latihan, dan pergerakan kas organisasi.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/members"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs inline-flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Kelola Anggota</span>
          </Link>
          <Link
            href="/dashboard/attendance"
            className="px-3.5 py-2 rounded-xl bg-scout-800 hover:bg-scout-700 text-white text-xs font-bold border border-scout-600 inline-flex items-center gap-1.5 transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Absensi Latihan</span>
          </Link>
          <Link
            href="/dashboard/finance"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 transition-all"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Catat Keuangan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* Members */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Anggota Aktif</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{membersCount}</p>
          <Link
            href="/dashboard/members"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
          >
            <span>Lihat semua anggota &rarr;</span>
          </Link>
        </div>

        {/* Scout Groups */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Regu & Sangga</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{groupsCount}</p>
          <Link
            href="/dashboard/groups"
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
          >
            <span>Manajemen regu &rarr;</span>
          </Link>
        </div>

        {/* Leaders */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pembina</span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{leadersCount}</p>
          <Link
            href="/dashboard/structure"
            className="text-xs font-semibold text-sky-700 hover:text-sky-800 inline-flex items-center gap-1"
          >
            <span>Struktur & Pembina &rarr;</span>
          </Link>
        </div>

        {/* Current Balance */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Saldo Kas Saat Ini</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{formatRupiah(currentBalance)}</p>
          <p className="text-[11px] text-slate-500">
            Masuk: {formatRupiah(totalIncome)} | Keluar: {formatRupiah(totalExpense)}
          </p>
        </div>
      </div>

      {/* Main Content Sections: Meetings & Finances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance & Latihan */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Pertemuan Latihan Mingguan</h2>
              <p className="text-xs text-slate-500">Catatan presensi pertemuan mingguan</p>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <span>Semua &rarr;</span>
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((mt) => (
                <div
                  key={mt.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{mt.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(mt.meetingDate)} • {mt.location || "Pangkalan"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {mt._count.records} Terabsen
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada pertemuan latihan dicatat.</p>
            )}
          </div>
        </div>

        {/* Keuangan Terbaru */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">Transaksi Kas Terbaru</h2>
              <p className="text-xs text-slate-500">Aktivitas arus kas pemasukan dan pengeluaran</p>
            </div>
            <Link
              href="/dashboard/finance"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              <span>Lihat Kas &rarr;</span>
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
                      className={`p-2 rounded-xl text-xs ${
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
                      <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{tx.title}</p>
                      <p className="text-[11px] text-slate-500">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`font-black text-xs sm:text-sm ${
                      tx.type === "PEMASUKAN" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {tx.type === "PEMASUKAN" ? "+" : "-"}
                    {formatRupiah(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada transaksi tercatat.</p>
            )}
          </div>
        </div>
      </div>

      {/* Audit Trail Log Summary */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Aktivitas Sistem & Audit Log</h2>
            <p className="text-xs text-slate-500">Riwayat operasional administratif terakhir</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">Terekam Otomatis</span>
        </div>

        <div className="space-y-2">
          {recentAudits.length > 0 ? (
            recentAudits.map((log) => (
              <div
                key={log.id}
                className="py-2.5 px-3 rounded-xl border border-slate-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-slate-600">{log.details || log.module}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2">
                  <span>{log.userName || "Sistem"}</span>
                  <span>•</span>
                  <span>{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-3 text-center">Belum ada riwayat aktivitas log.</p>
          )}
        </div>
      </div>
    </div>
  );
}
