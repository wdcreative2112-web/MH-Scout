import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeavePermitClientView } from "./LeavePermitClientView";

export const dynamic = "force-dynamic";

export default async function AttendanceLeavePage() {
  const session = await getSession();
  if (!session || (session.role !== "KETUA_REGU" && session.role !== "ADMIN" && session.role !== "SEKRETARIS")) {
    redirect("/dashboard");
  }

  const userGroupId = session.groupId;

  let group: any = null;
  let members: any[] = [];
  let meetings: any[] = [];
  let leaveLetters: any[] = [];

  try {
    // 1. Ambil data regu
    if (userGroupId) {
      group = await prisma.scoutGroup.findUnique({
        where: { id: userGroupId },
      });
    } else if (session.role === "ADMIN" || session.role === "SEKRETARIS") {
      // Jika admin membuka halaman ini, pilih regu pertama sebagai preview
      group = await prisma.scoutGroup.findFirst({
        where: { isActive: true },
      });
    }

    const targetGroupId = group?.id || userGroupId;

    if (targetGroupId) {
      // 2. Ambil anggota aktif dalam regu ini
      members = await prisma.member.findMany({
        where: {
          groupId: targetGroupId,
          status: "AKTIF",
        },
        orderBy: { fullName: "asc" },
        select: {
          id: true,
          fullName: true,
          memberNumber: true,
          groupId: true,
        },
      });
    }

    // 3. Ambil jadwal sesi latihan (termasuk sesi mendatang & yang baru lewat)
    meetings = await prisma.attendanceMeeting.findMany({
      where: {
        status: { not: "DIBATALKAN" },
      },
      orderBy: { meetingDate: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        meetingDate: true,
        startTime: true,
        endTime: true,
        location: true,
        status: true,
      },
    });

    // 4. Ambil riwayat surat izin yang pernah diajukan untuk regu ini
    const rawLetters = await prisma.letter.findMany({
      where: {
        type: "MASUK",
        notes: { contains: '"isAttendanceLeave":true' },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        letterNumber: true,
        subject: true,
        status: true,
        date: true,
        createdAt: true,
        notes: true,
      },
    });

    // Parse dan filter hanya untuk regu ini jika role KETUA_REGU
    leaveLetters = rawLetters
      .map((l) => {
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
          createdAt: l.createdAt.toISOString(),
          meetingId: parsed.meetingId || "",
          meetingTitle: parsed.meetingTitle || "",
          meetingDate: parsed.meetingDate || "",
          memberId: parsed.memberId || "",
          memberName: parsed.memberName || "",
          memberNumber: parsed.memberNumber || "",
          groupId: parsed.groupId || "",
          groupName: parsed.groupName || "",
          permitType: (parsed.permitType as "IZIN" | "SAKIT") || "IZIN",
          reason: parsed.reason || "",
          parentName: parsed.parentName || "",
          statusApproval:
            parsed.statusApproval ||
            (l.status === "DITERIMA" ? "DISETUJUI" : l.status === "DITOLAK" ? "DITOLAK" : "MENUNGGU"),
          submittedByName: parsed.submittedByName || "",
          approvedByName: parsed.approvedByName || "",
          approvedAt: parsed.approvedAt || "",
        };
      })
      .filter((item) => {
        if (session.role === "KETUA_REGU" && targetGroupId) {
          return item.groupId === targetGroupId;
        }
        return true;
      });
  } catch (err) {
    console.error("Error loading leave permit page data:", err);
  }

  return (
    <LeavePermitClientView
      group={group}
      members={members}
      meetings={meetings.map((m) => ({
        ...m,
        meetingDate: m.meetingDate.toISOString(),
      }))}
      leaveLetters={leaveLetters}
      userRole={session.role}
      userName={session.name}
    />
  );
}
