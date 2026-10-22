import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Shield,
  Users,
  CheckSquare,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Award,
  Phone,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  FileText,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KetuaReguDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "KETUA_REGU" && session.role !== "ADMIN")) {
    redirect("/dashboard");
  }

  const userGroupId = session.groupId;

  let group: any = null;
  let members: any[] = [];
  let latestMeeting: any = null;
  let upcomingActivities: any[] = [];
  let meetingRecords: any[] = [];

  try {
    if (userGroupId) {
      group = await prisma.scoutGroup.findUnique({
        where: { id: userGroupId },
        include: { leader: true },
      });
    } else {
      // If admin testing without groupId, pick the first group
      group = await prisma.scoutGroup.findFirst({
        where: { isActive: true },
        include: { leader: true },
      });
    }

    if (group) {
      members = await prisma.member.findMany({
        where: { groupId: group.id, status: "AKTIF" },
        orderBy: { fullName: "asc" },
      });

      latestMeeting = await prisma.attendanceMeeting.findFirst({
        orderBy: { meetingDate: "desc" },
      });

      if (latestMeeting) {
        meetingRecords = await prisma.attendanceRecord.findMany({
          where: {
            meetingId: latestMeeting.id,
            member: { groupId: group.id },
          },
          include: { member: true },
        });
      }

      upcomingActivities = await prisma.activity.findMany({
        where: {
          startDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { startDate: "asc" },
        take: 3,
      });
    }
  } catch (err) {
    console.error("Ketua Regu Dashboard fetch error:", err);
  }

  // Attendance stats for latest meeting
  const recordMap = new Map<string, string>();
  meetingRecords.forEach((r) => recordMap.set(r.memberId, r.status));

  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;

  members.forEach((m) => {
    const st = recordMap.get(m.id);
    if (st === "HADIR") hadirCount++;
    else if (st === "IZIN") izinCount++;
    else if (st === "SAKIT") sakitCount++;
    else if (st === "ALPA") alpaCount++;
  });

  const totalRecorded = hadirCount + izinCount + sakitCount + alpaCount;
  const attendanceRate =
    members.length > 0 && totalRecorded > 0
      ? Math.round((hadirCount / members.length) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-700/10 skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 backdrop-blur-md text-[11px] font-bold text-emerald-200 border border-emerald-600/40">
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span>Portal Pemimpin Regu (PINRU)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              {group ? group.name : "Regu Pramuka"}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 max-w-xl">
              {group?.description ||
                "Selamat bertugas! Kelola presensi latihan mingguan dan pantau perkembangan anggota regu Anda."}
            </p>
            {group && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-emerald-200">
                <span className="bg-emerald-950/40 px-2.5 py-1 rounded-md font-semibold border border-emerald-700/30">
                  Kategori: {group.category}
                </span>
                {group.leader && (
                  <span className="bg-emerald-950/40 px-2.5 py-1 rounded-md font-semibold border border-emerald-700/30">
                    Pembina: {group.leader.name}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              href={`/dashboard/attendance${latestMeeting ? `?meetingId=${latestMeeting.id}` : ""}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all active:scale-95"
            >
              <CheckSquare className="w-4 h-4 text-slate-950" />
              <span>Presensi Latihan</span>
            </Link>
            <Link
              href="/dashboard/attendance/izin"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-emerald-500/40 transition-all"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Pengajuan Izin</span>
            </Link>
            <Link
              href="/dashboard/members"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Data Anggota</span>
            </Link>
          </div>
        </div>
      </div>

      {!group && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-sm">Akun Belum Dihubungkan ke Regu</h3>
            <p className="text-xs text-amber-800 mt-1">
              Akun Anda belum memiliki regu yang diasosiasikan. Silakan hubungi Administrator atau Pembina Satuan untuk memilih regu Anda di menu Manajemen Pengguna.
            </p>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Anggota Regu
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{members.length}</span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">Aktif</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Terdaftar dalam {group?.name || "regu"}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Kehadiran Latihan
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{attendanceRate}%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pertemuan terakhir</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Status Hadir
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700">{hadirCount}</span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">/ {members.length}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {izinCount > 0 ? `${izinCount} Izin, ` : ""}
            {sakitCount > 0 ? `${sakitCount} Sakit, ` : ""}
            {alpaCount > 0 ? `${alpaCount} Alpa` : "Semua tercatat"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tingkatan SKU
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-700">
              {members.filter((m) => m.scoutLevel && m.scoutLevel.toLowerCase().includes("terap")).length ||
                members.filter((m) => m.scoutLevel && m.scoutLevel.toLowerCase().includes("rakit")).length ||
                members.length}
            </span>
            <span className="text-xs text-slate-500 ml-1 font-semibold">SKU</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Capaian kecakapan umum</p>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Quick Attendance & Members Table */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Attendance Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                  <span>Presensi Latihan Terakhir</span>
                </h2>
                {latestMeeting && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {latestMeeting.title} — {formatDate(latestMeeting.meetingDate)}
                  </p>
                )}
              </div>
              <Link
                href={`/dashboard/attendance${latestMeeting ? `?meetingId=${latestMeeting.id}` : ""}`}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lembar Lengkap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {members.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {members.slice(0, 6).map((m) => {
                  const status = recordMap.get(m.id) || "BELUM";
                  return (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {m.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900">{m.fullName}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{m.memberNumber}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          status === "HADIR"
                            ? "bg-emerald-100 text-emerald-800"
                            : status === "IZIN"
                            ? "bg-blue-100 text-blue-800"
                            : status === "SAKIT"
                            ? "bg-amber-100 text-amber-800"
                            : status === "ALPA"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {status === "BELUM" ? "Belum Diabsen" : status}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada anggota di regu ini.</p>
            )}

            <div className="pt-2">
              <Link
                href={`/dashboard/attendance${latestMeeting ? `?meetingId=${latestMeeting.id}` : ""}`}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Buka Lembar Presensi Regu</span>
              </Link>
            </div>
          </div>

          {/* Members List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <span>Daftar Anggota {group?.name || "Regu"}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Kontak dan tingkatan anggota regu Anda</p>
              </div>
              <Link
                href="/dashboard/members"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <span>Lihat Semua ({members.length})</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Cards (Visible on screens < sm) */}
            <div className="sm:hidden space-y-2.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/50">
                      {m.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{m.fullName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Kelas: {m.classGrade || "-"} • {m.phone || m.parentPhone || "No HP -"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                    {m.scoutLevel || "Penggalang"}
                  </span>
                </div>
              ))}
              {members.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada anggota terdaftar di regu ini.
                </div>
              )}
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5">Nama Anggota</th>
                    <th className="py-2.5">Kelas</th>
                    <th className="py-2.5">Tingkat SKU</th>
                    <th className="py-2.5 text-right">Kontak HP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {m.fullName.charAt(0)}
                          </div>
                          <span>{m.fullName}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">{m.classGrade || "-"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {m.scoutLevel || "Penggalang"}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-500 font-mono text-[11px]">
                        {m.phone || m.parentPhone || "-"}
                      </td>
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        Belum ada anggota terdaftar di regu ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Jadwal & Pembina */}
        <div className="space-y-6">
          {/* Pembina Pendamping Card */}
          {group?.leader && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Pembina Pendamping
              </span>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shrink-0">
                  {group.leader.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{group.leader.name}</h3>
                  <p className="text-xs text-slate-500">{group.leader.position || "Pembina Satuan"}</p>
                </div>
              </div>

              {group.leader.phone && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Telepon</span>
                  </span>
                  <a
                    href={`https://wa.me/${group.leader.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    {group.leader.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Agenda Kegiatan Terdekat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Kegiatan Terdekat</span>
              </h3>
              <Link
                href="/dashboard/activities"
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
              >
                Lihat Semua
              </Link>
            </div>

            {upcomingActivities.length > 0 ? (
              <div className="space-y-3">
                {upcomingActivities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(act.startDate)}</span>
                      </span>
                      {act.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{act.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Belum ada jadwal kegiatan terdekat.</p>
            )}
          </div>

          {/* Dasa Darma Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-5 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Semangat Kepanduan</span>
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed italic">
              &quot;Seorang Pemimpin Regu memimpin dengan keteladanan, kedisiplinan, dan rasa persaudaraan yang tulus.&quot;
            </p>
            <p className="text-[11px] font-semibold text-emerald-700">— Tri Satya & Dasa Darma</p>
          </div>
        </div>
      </div>
    </div>
  );
}
