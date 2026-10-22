import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceClientView } from "./AttendanceClientView";
import { getRoutineScheduleConfig, syncRoutineMeetings } from "@/lib/routineSchedule";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ meetingId?: string; reguId?: string; mode?: string; tab?: string }>;
}) {
  const session = await getSession();
  const { meetingId, reguId, mode, tab } = await searchParams;

  let meetings: any[] = [];
  let members: any[] = [];
  let groups: any[] = [];
  let currentMeetingRecords: any[] = [];
  let activeMeeting = null;
  let routineConfig = null;
  let lastAuditLog: any = null;

  try {
    // Sinkronkan jadwal rutin otomatis jika ada sesi yang perlu diterbitkan
    await syncRoutineMeetings().catch(() => {});
    routineConfig = await getRoutineScheduleConfig();

    const allMeetings = await prisma.attendanceMeeting.findMany({
      orderBy: { meetingDate: "desc" },
      include: {
        records: true,
      },
    });

    // Bersihkan sesi ganda pada tanggal yang sama yang belum memiliki data absensi
    const seenDates = new Set<string>();
    const duplicateIdsToDelete: string[] = [];
    const uniqueMeetings: any[] = [];

    for (const m of allMeetings) {
      const d = new Date(m.meetingDate);
      const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (seenDates.has(dateKey) && (!m.records || m.records.length === 0)) {
        duplicateIdsToDelete.push(m.id);
        continue;
      }
      seenDates.add(dateKey);
      uniqueMeetings.push(m);
    }

    if (duplicateIdsToDelete.length > 0) {
      await prisma.attendanceMeeting.deleteMany({
        where: { id: { in: duplicateIdsToDelete } },
      }).catch(() => {});
    }

    // Default to today's meeting if any exists, otherwise first meeting in list
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Sort meetings by proximity to Hari H (today):
    // 1. Hari H (today, diff === 0)
    // 2. Upcoming meetings closest to today first (e.g. H-1 tomorrow, then H-2, H-8 next week)
    // 3. Past meetings (most recent past to older past)
    uniqueMeetings.sort((a, b) => {
      const da = new Date(a.meetingDate);
      const db = new Date(b.meetingDate);
      const dayA = new Date(da.getFullYear(), da.getMonth(), da.getDate(), 0, 0, 0, 0).getTime();
      const dayB = new Date(db.getFullYear(), db.getMonth(), db.getDate(), 0, 0, 0, 0).getTime();

      const diffA = Math.round((dayA - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffB = Math.round((dayB - today.getTime()) / (1000 * 60 * 60 * 24));

      const catA = diffA === 0 ? 0 : diffA > 0 ? 1 : 2;
      const catB = diffB === 0 ? 0 : diffB > 0 ? 1 : 2;

      if (catA !== catB) {
        return catA - catB;
      }
      if (catA === 1) {
        return diffA - diffB; // Closest upcoming to Hari H first
      }
      if (catA === 2) {
        return diffB - diffA; // Most recent past first
      }
      return 0;
    });

    meetings = uniqueMeetings;

    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    members = await prisma.member.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      include: { group: true },
    });

    const todayMeeting = meetings.find((m) => {
      const md = new Date(m.meetingDate);
      const mDay = new Date(md.getFullYear(), md.getMonth(), md.getDate(), 0, 0, 0, 0);
      return mDay.getTime() === today.getTime();
    });

    const isKetuaRegu = session?.role === "KETUA_REGU";
    const userGroupId = session?.groupId || "";
    const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS" || isKetuaRegu;

    const targetMeetingId = meetingId || (todayMeeting ? todayMeeting.id : (meetings.length > 0 ? meetings[0].id : null));

    if (targetMeetingId) {
      activeMeeting = meetings.find((m) => m.id === targetMeetingId) || null;
      if (activeMeeting) {
        currentMeetingRecords = await prisma.attendanceRecord.findMany({
          where: {
            meetingId: activeMeeting.id,
            ...(isKetuaRegu && userGroupId ? { member: { groupId: userGroupId } } : {}),
          },
          include: { member: true },
        });

        lastAuditLog = await prisma.attendanceAuditLog.findFirst({
          where: { meetingId: activeMeeting.id },
          orderBy: { createdAt: "desc" },
          include: { changedBy: { select: { name: true, role: true } } },
        });
      }
    }

    // Query Denda Absensi (Alpa)
    let fineDuesType = await prisma.duesType.findFirst({
      where: { name: "Denda Absensi (Alpa)" },
    });

    if (!fineDuesType) {
      fineDuesType = await prisma.duesType.create({
        data: {
          name: "Denda Absensi (Alpa)",
          amount: 5000,
          period: "INSIDENTAL",
          description: "Denda ketidakhadiran tanpa keterangan (Alpa) pada latihan mingguan.",
        },
      }).catch(() => null);
    }

    let fines: any[] = [];
    if (fineDuesType) {
      const rawFines = await prisma.memberDues.findMany({
        where: { duesTypeId: fineDuesType.id },
        include: {
          member: {
            include: { group: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      fines = rawFines.map((f) => ({
        id: f.id,
        memberId: f.memberId,
        memberName: f.member.fullName,
        memberNumber: f.member.memberNumber,
        groupId: f.member.groupId || "",
        groupName: f.member.group?.name || "-",
        periodName: f.periodName,
        amount: Number(f.amount),
        amountPaid: Number(f.amountPaid),
        status: f.status,
        paidAt: f.paidAt ? f.paidAt.toISOString() : null,
        createdAt: f.createdAt.toISOString(),
        notes: f.notes,
      }));
    }

    const fineAmount = fineDuesType ? Number(fineDuesType.amount) : 5000;

    // If Ketua Regu, filter members to their regu only
    const filteredMembers = isKetuaRegu && userGroupId
      ? members.filter((m) => m.groupId === userGroupId)
      : members;

    // Filter fines for Ketua Regu
    const filteredFines = isKetuaRegu && userGroupId
      ? fines.filter((f) => f.groupId === userGroupId)
      : fines;

    // Query Surat Izin Ketidakhadiran (Leave Requests)
    const rawLeaveLetters = await prisma.letter.findMany({
      where: {
        notes: { contains: "isAttendanceLeave" },
      },
      orderBy: { createdAt: "desc" },
    });

    const leaveRequests = rawLeaveLetters.map((l) => {
      let parsed: any = {};
      try {
        parsed = l.notes ? JSON.parse(l.notes) : {};
      } catch {}
      return {
        id: l.id,
        letterNumber: l.letterNumber,
        subject: l.subject,
        status: l.status,
        date: l.date.toISOString(),
        meetingId: parsed.meetingId || "",
        memberId: parsed.memberId || "",
        memberName: parsed.memberName || "",
        memberNumber: parsed.memberNumber || "",
        groupId: parsed.groupId || "",
        groupName: parsed.groupName || "",
        permitType: (parsed.permitType as "IZIN" | "SAKIT") || "IZIN",
        reason: parsed.reason || l.summary || "",
        parentName: parsed.parentName || "",
        statusApproval: parsed.statusApproval || (l.status === "DITERIMA" ? "DISETUJUI" : l.status === "DITOLAK" ? "DITOLAK" : "MENUNGGU"),
        submittedByName: parsed.submittedByName || "",
        submittedAt: parsed.submittedAt || l.createdAt.toISOString(),
      };
    });

    // Filter leave requests for Ketua Regu
    const filteredLeaveRequests = isKetuaRegu && userGroupId
      ? leaveRequests.filter((lr) => lr.groupId === userGroupId)
      : leaveRequests;

    return (
      <div className="space-y-6">
        <AttendanceClientView
          meetings={meetings}
          members={filteredMembers}
          allMembers={members}
          groups={groups}
          activeMeeting={activeMeeting}
          currentRecords={currentMeetingRecords}
          canEdit={canEdit}
          userRole={session?.role || "GUEST"}
          isKetuaRegu={isKetuaRegu}
          userGroupId={userGroupId}
          userGroupName={session?.groupName || null}
          initialMode={isKetuaRegu ? "REGU" : ((mode as "ALL" | "REGU") || "ALL")}
          initialReguId={isKetuaRegu ? userGroupId : (reguId || "")}
          routineConfig={routineConfig}
          initialFines={filteredFines}
          initialFineAmount={fineAmount}
          initialLeaveRequests={filteredLeaveRequests}
          initialTab={isKetuaRegu ? "SHEET" : (tab ? (tab.toUpperCase() as any) : "MENU")}
          lastAuditLog={lastAuditLog ? {
            userName: lastAuditLog.changedBy?.name || "Pengurus",
            userRole: lastAuditLog.changedBy?.role || "PENGURUS",
            createdAt: lastAuditLog.createdAt.toISOString(),
          } : null}
        />
      </div>
    );
  } catch {
    // DB fallback
    return (
      <div className="p-6 text-center text-sm text-slate-500">
        Gagal memuat data presensi. Silakan periksa koneksi database.
      </div>
    );
  }
}
