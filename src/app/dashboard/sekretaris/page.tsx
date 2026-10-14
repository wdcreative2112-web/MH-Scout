import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Shield,
  Calendar,
  CheckSquare,
  FileText,
  AlertCircle,
  PlusCircle,
  Newspaper,
  BookOpen,
  Image as ImageIcon,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SekretarisDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "SEKRETARIS" && session.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  let membersCount = 0;
  let groupsCount = 0;
  let recentMeetings: any[] = [];
  let unrecordedMeetings: any[] = [];
  let draftNewsCount = 0;
  let draftArticleCount = 0;
  let recentActivities: any[] = [];

  try {
    const [mCount, gCount] = await Promise.all([
      prisma.member.count({ where: { status: "AKTIF" } }),
      prisma.scoutGroup.count({ where: { isActive: true } }),
    ]);
    membersCount = mCount;
    groupsCount = gCount;

    recentMeetings = await prisma.attendanceMeeting.findMany({
      take: 4,
      orderBy: { meetingDate: "desc" },
      include: {
        _count: { select: { records: true } },
      },
    });

    // Check meetings that have 0 records
    unrecordedMeetings = recentMeetings.filter((m) => m._count.records === 0);

    const [dNews, dArt] = await Promise.all([
      prisma.news.count({ where: { status: "DRAF" } }),
      prisma.article.count({ where: { status: "DRAF" } }),
    ]);
    draftNewsCount = dNews;
    draftArticleCount = dArt;

    recentActivities = await prisma.activity.findMany({
      take: 3,
      orderBy: { startDate: "desc" },
    });
  } catch {
    // DB error fallback
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-scout-900 via-scout-800 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scout-950 text-emerald-300 text-xs font-bold border border-emerald-800">
            <span>Portal Sekretariat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Dashboard Sekretaris — {session.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Kelola data anggota, jadwalkan latihan mingguan, catat absensi per regu, dan kelola warta publikasi.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/dashboard/attendance"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-scout-950 text-xs font-black shadow-xs inline-flex items-center gap-1.5 transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Catat Absensi</span>
          </Link>
          <Link
            href="/dashboard/members"
            className="px-3.5 py-2 rounded-xl bg-scout-800 hover:bg-scout-700 text-white text-xs font-bold border border-scout-600 inline-flex items-center gap-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Data Anggota</span>
          </Link>
          <Link
            href="/dashboard/news"
            className="px-3.5 py-2 rounded-xl bg-scout-800 hover:bg-scout-700 text-white text-xs font-bold border border-scout-600 inline-flex items-center gap-1.5 transition-all"
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Tulis Berita</span>
          </Link>
        </div>
      </div>

      {/* Alert if any meeting has not been recorded */}
      {unrecordedMeetings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="font-bold">Perhatian: Terdapat Pertemuan Latihan yang Belum Diabsen</p>
            <p className="text-amber-800">
              Ada {unrecordedMeetings.length} pertemuan latihan yang belum memiliki catatan absensi. Segera buka menu Absensi untuk merekam kehadiran peserta.
            </p>
            <div className="pt-1">
              <Link
                href="/dashboard/attendance"
                className="font-bold underline text-amber-900 hover:text-amber-700"
              >
                Buka Menu Absensi Sekarang &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Anggota Aktif</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{membersCount}</p>
          <Link href="/dashboard/members" className="text-xs font-semibold text-emerald-700">
            Daftar Anggota &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Regu Terdaftar</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{groupsCount}</p>
          <Link href="/dashboard/groups" className="text-xs font-semibold text-emerald-700">
            Lihat Regu &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Draf Berita</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{draftNewsCount}</p>
          <Link href="/dashboard/news" className="text-xs font-semibold text-emerald-700">
            Kelola Publikasi &rarr;
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Draf Artikel</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{draftArticleCount}</p>
          <Link href="/dashboard/articles" className="text-xs font-semibold text-emerald-700">
            Materi Edukasi &rarr;
          </Link>
        </div>
      </div>

      {/* Two columns: Attendance Meetings & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Jadwal Latihan Mingguan</h2>
            <Link
              href="/dashboard/attendance"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Semua Pertemuan &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentMeetings.length > 0 ? (
              recentMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{m.title}</h3>
                    <p className="text-xs text-slate-500">
                      {formatDate(m.meetingDate)} • {m.location || "Pangkalan"}
                    </p>
                  </div>
                  <div>
                    {m._count.records > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {m._count.records} Terabsen
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        Belum Diabsen
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada pertemuan tercatat.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 text-base sm:text-lg">Agenda Kegiatan Mendatang</h2>
            <Link
              href="/dashboard/activities"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Kelola Kegiatan &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {act.category}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1">{act.title}</h3>
                    <p className="text-xs text-slate-500">{formatDate(act.startDate)}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{act.status}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada agenda kegiatan.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
