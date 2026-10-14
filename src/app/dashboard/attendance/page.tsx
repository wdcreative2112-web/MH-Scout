import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AttendanceClientView } from "./AttendanceClientView";
import { getRoutineScheduleConfig, syncRoutineMeetings } from "@/lib/routineSchedule";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ meetingId?: string; reguId?: string; mode?: string }>;
}) {
  const session = await getSession();
  const { meetingId, reguId, mode } = await searchParams;

  let meetings: any[] = [];
  let members: any[] = [];
  let groups: any[] = [];
  let currentMeetingRecords: any[] = [];
  let activeMeeting = null;
  let routineConfig = null;

  try {
    // Sinkronkan jadwal rutin otomatis jika ada sesi yang perlu diterbitkan
    await syncRoutineMeetings().catch(() => {});
    routineConfig = await getRoutineScheduleConfig();

    meetings = await prisma.attendanceMeeting.findMany({
      orderBy: { meetingDate: "desc" },
      include: {
        records: true,
      },
    });

    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    members = await prisma.member.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      include: { group: true },
    });

    // Default to first meeting if meetingId not in query
    const targetMeetingId = meetingId || (meetings.length > 0 ? meetings[0].id : null);

    if (targetMeetingId) {
      activeMeeting = meetings.find((m) => m.id === targetMeetingId) || null;
      if (activeMeeting) {
        currentMeetingRecords = await prisma.attendanceRecord.findMany({
          where: { meetingId: activeMeeting.id },
          include: { member: true },
        });
      }
    }
  } catch {
    // DB fallback
  }

  const isKetuaRegu = session?.role === "KETUA_REGU";
  const userGroupId = session?.groupId || "";
  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS" || isKetuaRegu;

  // If Ketua Regu, filter members to their regu only
  const filteredMembers = isKetuaRegu && userGroupId
    ? members.filter((m) => m.groupId === userGroupId)
    : members;

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
      />
    </div>
  );
}
