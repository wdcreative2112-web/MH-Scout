"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { letterSchema } from "@/lib/validations/content";

export async function createLetterAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    letterNumber: formData.get("letterNumber") as string,
    type: formData.get("type") as "MASUK" | "KELUAR",
    date: formData.get("date") as string,
    subject: formData.get("subject") as string,
    sender: (formData.get("sender") as string) || null,
    recipient: (formData.get("recipient") as string) || null,
    summary: (formData.get("summary") as string) || null,
    status: (formData.get("status") as any) || "DRAF",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = letterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const letter = await prisma.letter.create({
      data: {
        letterNumber: parsed.data.letterNumber,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        subject: parsed.data.subject,
        sender: parsed.data.sender,
        recipient: parsed.data.recipient,
        summary: parsed.data.summary,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch {
    return { success: false, error: "Gagal menyimpan data surat." };
  }
}

export async function updateLetterAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    letterNumber: formData.get("letterNumber") as string,
    type: formData.get("type") as "MASUK" | "KELUAR",
    date: formData.get("date") as string,
    subject: formData.get("subject") as string,
    sender: (formData.get("sender") as string) || null,
    recipient: (formData.get("recipient") as string) || null,
    summary: (formData.get("summary") as string) || null,
    status: (formData.get("status") as any) || "DRAF",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = letterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const letter = await prisma.letter.update({
      where: { id },
      data: {
        letterNumber: parsed.data.letterNumber,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        subject: parsed.data.subject,
        sender: parsed.data.sender,
        recipient: parsed.data.recipient,
        summary: parsed.data.summary,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_SURAT",
        module: "SURAT",
        details: `Mengubah arsip surat: ${letter.letterNumber} - ${letter.subject}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch {
    return { success: false, error: "Gagal memperbarui data surat." };
  }
}

export async function deleteLetterAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const letter = await prisma.letter.findUnique({
      where: { id },
      select: { id: true, letterNumber: true, subject: true },
    });

    if (!letter) {
      return { success: false, error: "Surat tidak ditemukan." };
    }

    await prisma.letter.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_SURAT",
        module: "SURAT",
        details: `Menghapus arsip surat: ${letter.letterNumber} - ${letter.subject}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true };
  } catch (err: any) {
    console.error("Delete letter error:", err);
    return { success: false, error: "Gagal menghapus data surat." };
  }
}

export async function createPermitLetterAction(formData: FormData) {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS" && session.role !== "KETUA_REGU") {
    return { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang mengelola surat izin." };
  }

  const memberId = (formData.get("memberId") as string) || "";

  // Jika KETUA_REGU, verifikasi bahwa anggota termasuk dalam regunya
  if (session.role === "KETUA_REGU") {
    if (!session.groupId) {
      return { success: false, error: "Akses ditolak: Akun Ketua Regu belum terhubung ke regu manapun." };
    }
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { groupId: true },
      });
      if (!member || member.groupId !== session.groupId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat membuat surat izin untuk anggota regu Anda." };
      }
    }
  }

  const letterNumber = (formData.get("letterNumber") as string)?.trim();
  const dateStr = (formData.get("date") as string) || new Date().toISOString();
  const memberName = (formData.get("memberName") as string)?.trim();
  const memberNumber = (formData.get("memberNumber") as string)?.trim() || "-";
  const groupName = (formData.get("groupName") as string)?.trim() || "-";
  const scoutLevel = (formData.get("scoutLevel") as string)?.trim() || "Penggalang";
  const classGrade = (formData.get("classGrade") as string)?.trim() || "";
  const activityTitle = (formData.get("activityTitle") as string)?.trim() || "Kegiatan Pramuka";
  const permitType = (formData.get("permitType") as string) === "SAKIT" ? "SAKIT" : "IZIN";
  const startDate = (formData.get("startDate") as string) || dateStr.split("T")[0];
  const endDate = (formData.get("endDate") as string) || startDate;
  const reason = (formData.get("reason") as string)?.trim() || "Berhalangan hadir";
  const parentName = (formData.get("parentName") as string)?.trim() || "Orang Tua / Wali";
  const parentPhone = (formData.get("parentPhone") as string)?.trim() || "";
  const leaderName = (formData.get("leaderName") as string)?.trim() || "Pembina Satuan";
  const leaderNip = (formData.get("leaderNip") as string)?.trim() || "-";
  const createdPlace = (formData.get("createdPlace") as string)?.trim() || "Jakarta";
  const activityId = (formData.get("activityId") as string) || "";

  if (!letterNumber) {
    return { success: false, error: "Nomor surat permohonan izin wajib diisi." };
  }
  if (!memberName) {
    return { success: false, error: "Nama anggota wajib diisi atau dipilih." };
  }
  if (!reason) {
    return { success: false, error: "Alasan atau keterangan izin wajib diisi." };
  }

  const structuredNotes = JSON.stringify({
    isPermitLetter: true,
    permitType,
    memberId,
    memberName,
    memberNumber,
    groupName,
    scoutLevel,
    classGrade,
    activityId,
    activityTitle,
    startDate,
    endDate,
    reason,
    parentName,
    parentPhone,
    leaderName,
    leaderNip,
    createdPlace,
  });

  const subject = `Surat Izin ${permitType === "SAKIT" ? "Sakit" : "Izin"} - ${memberName} (${activityTitle})`;
  const summary = `Permohonan izin ${permitType === "SAKIT" ? "sakit" : "tidak hadir"} untuk anggota ${memberName} (${memberNumber}, Regu ${groupName}) pada kegiatan ${activityTitle} (${startDate} s.d. ${endDate}). Alasan: ${reason}`;

  try {
    const letter = await prisma.letter.create({
      data: {
        letterNumber,
        type: "KELUAR",
        date: new Date(dateStr),
        subject,
        sender: `Orang Tua / Wali (${parentName})`,
        recipient: `Pembina Gugus Depan (${leaderName})`,
        summary,
        status: "DIKIRIM",
        notes: structuredNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "BUAT_SURAT_IZIN",
        module: "SURAT",
        details: `Membuat surat izin ${permitType}: ${letter.letterNumber} untuk ${memberName}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch (err: any) {
    console.error("Create permit letter error:", err);
    return { success: false, error: "Gagal menyimpan surat izin anggota." };
  }
}

export async function updatePermitLetterAction(id: string, formData: FormData) {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Admin dan Sekretaris yang dapat memperbarui surat izin." };
  }

  const letterNumber = (formData.get("letterNumber") as string)?.trim();
  const dateStr = (formData.get("date") as string) || new Date().toISOString();
  const memberName = (formData.get("memberName") as string)?.trim();
  const memberNumber = (formData.get("memberNumber") as string)?.trim() || "-";
  const groupName = (formData.get("groupName") as string)?.trim() || "-";
  const scoutLevel = (formData.get("scoutLevel") as string)?.trim() || "Penggalang";
  const classGrade = (formData.get("classGrade") as string)?.trim() || "";
  const activityTitle = (formData.get("activityTitle") as string)?.trim() || "Kegiatan Pramuka";
  const permitType = (formData.get("permitType") as string) === "SAKIT" ? "SAKIT" : "IZIN";
  const startDate = (formData.get("startDate") as string) || dateStr.split("T")[0];
  const endDate = (formData.get("endDate") as string) || startDate;
  const reason = (formData.get("reason") as string)?.trim() || "Berhalangan hadir";
  const parentName = (formData.get("parentName") as string)?.trim() || "Orang Tua / Wali";
  const parentPhone = (formData.get("parentPhone") as string)?.trim() || "";
  const leaderName = (formData.get("leaderName") as string)?.trim() || "Pembina Satuan";
  const leaderNip = (formData.get("leaderNip") as string)?.trim() || "-";
  const createdPlace = (formData.get("createdPlace") as string)?.trim() || "Jakarta";
  const memberId = (formData.get("memberId") as string) || "";
  const activityId = (formData.get("activityId") as string) || "";

  if (!letterNumber) {
    return { success: false, error: "Nomor surat permohonan izin wajib diisi." };
  }
  if (!memberName) {
    return { success: false, error: "Nama anggota wajib diisi atau dipilih." };
  }

  const structuredNotes = JSON.stringify({
    isPermitLetter: true,
    permitType,
    memberId,
    memberName,
    memberNumber,
    groupName,
    scoutLevel,
    classGrade,
    activityId,
    activityTitle,
    startDate,
    endDate,
    reason,
    parentName,
    parentPhone,
    leaderName,
    leaderNip,
    createdPlace,
  });

  const subject = `Surat Izin ${permitType === "SAKIT" ? "Sakit" : "Izin"} - ${memberName} (${activityTitle})`;
  const summary = `Permohonan izin ${permitType === "SAKIT" ? "sakit" : "tidak hadir"} untuk anggota ${memberName} (${memberNumber}, Regu ${groupName}) pada kegiatan ${activityTitle} (${startDate} s.d. ${endDate}). Alasan: ${reason}`;

  try {
    const letter = await prisma.letter.update({
      where: { id },
      data: {
        letterNumber,
        type: "KELUAR",
        date: new Date(dateStr),
        subject,
        sender: `Orang Tua / Wali (${parentName})`,
        recipient: `Pembina Gugus Depan (${leaderName})`,
        summary,
        notes: structuredNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_SURAT_IZIN",
        module: "SURAT",
        details: `Mengubah surat izin ${permitType}: ${letter.letterNumber} untuk ${memberName}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch (err: any) {
    console.error("Update permit letter error:", err);
    return { success: false, error: "Gagal memperbarui surat izin anggota." };
  }
}

/**
 * Pengajuan Surat Izin/Sakit Ketidakhadiran dari Ketua Regu
 */
export async function submitLeavePermitAction(data: {
  memberId: string;
  meetingId: string;
  permitType: "IZIN" | "SAKIT";
  reason: string;
  parentName?: string;
  parentPhone?: string;
}) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS" && session.role !== "KETUA_REGU") {
    return { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang mengajukan izin." };
  }

  const { memberId, meetingId, permitType, reason, parentName, parentPhone } = data;

  if (!memberId || !meetingId || !permitType || !reason?.trim()) {
    return { success: false, error: "Data permohonan izin belum lengkap." };
  }

  // Security check for Ketua Regu
  if (session.role === "KETUA_REGU") {
    if (!session.groupId) {
      return { success: false, error: "Akun Anda belum terhubung dengan regu manapun." };
    }
    const memberCheck = await prisma.member.findUnique({
      where: { id: memberId },
      select: { groupId: true },
    });
    if (!memberCheck || memberCheck.groupId !== session.groupId) {
      return { success: false, error: "Akses ditolak: Anda hanya dapat mengajukan izin untuk anggota regu Anda." };
    }
  }

  try {
    const [member, meeting, letterCount] = await Promise.all([
      prisma.member.findUnique({
        where: { id: memberId },
        include: { group: true },
      }),
      prisma.attendanceMeeting.findUnique({
        where: { id: meetingId },
      }),
      prisma.letter.count(),
    ]);

    if (!member) return { success: false, error: "Anggota tidak ditemukan." };
    if (!meeting) return { success: false, error: "Pertemuan latihan tidak ditemukan." };

    const { generatePermitLetterNumber } = await import("@/lib/permit-letter");
    const letterNumber = generatePermitLetterNumber(letterCount, new Date(meeting.meetingDate));

    const structuredNotes = JSON.stringify({
      isPermitLetter: true,
      isAttendanceLeave: true,
      permitType,
      memberId: member.id,
      memberName: member.fullName,
      memberNumber: member.memberNumber || "-",
      groupId: member.groupId || "",
      groupName: member.group?.name || "-",
      meetingId: meeting.id,
      meetingTitle: meeting.title,
      meetingDate: meeting.meetingDate.toISOString(),
      reason: reason.trim(),
      parentName: parentName?.trim() || "Orang Tua / Wali",
      parentPhone: parentPhone?.trim() || "",
      statusApproval: "MENUNGGU",
      submittedById: session.id,
      submittedByName: session.name,
      submittedAt: new Date().toISOString(),
    });

    const subject = `Permohonan Izin ${permitType === "SAKIT" ? "Sakit" : "Tidak Hadir"} - ${member.fullName} (${member.group?.name || "Pramuka"})`;
    const summary = `Permohonan izin ${permitType === "SAKIT" ? "sakit" : "tidak hadir"} untuk anggota ${member.fullName} (${member.memberNumber || "-"}, Regu ${member.group?.name || "-"}) pada sesi latihan "${meeting.title}". Alasan: ${reason.trim()}`;

    const letter = await prisma.letter.create({
      data: {
        letterNumber,
        type: "MASUK",
        date: new Date(meeting.meetingDate),
        subject,
        sender: `Orang Tua / Wali (${parentName?.trim() || "Wali Murid"}) melalui Ketua Regu`,
        recipient: "Pembina & Sekretaris Gugus Depan",
        summary,
        status: "MENUNGGU",
        notes: structuredNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "AJUKAN_IZIN_ANGGOTA",
        module: "ABSENSI",
        details: `Mengajukan surat izin ${permitType}: ${letter.letterNumber} untuk ${member.fullName} (${meeting.title})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/letters");
    revalidatePath("/dashboard");
    return { success: true, data: letter };
  } catch (err: any) {
    console.error("Submit leave permit error:", err);
    return { success: false, error: "Gagal mengajukan surat izin anggota." };
  }
}

/**
 * Persetujuan Surat Izin oleh Admin / Sekretaris
 * Otomatis memperbarui AttendanceRecord menjadi IZIN/SAKIT dan membatalkan denda Alpa jika ada.
 */
export async function approveLeavePermitAction(letterId: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Pembina/Admin dan Sekretaris yang berwenang menyetujui surat izin." };
  }

  try {
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
    });
    if (!letter) {
      return { success: false, error: "Data surat permohonan izin tidak ditemukan." };
    }

    let parsedNotes: any = null;
    try {
      parsedNotes = letter.notes ? JSON.parse(letter.notes) : null;
    } catch {}

    if (!parsedNotes || !parsedNotes.isAttendanceLeave || !parsedNotes.memberId || !parsedNotes.meetingId) {
      return { success: false, error: "Format surat permohonan izin tidak valid." };
    }

    const { memberId, meetingId, permitType, reason } = parsedNotes;
    const finalStatus = permitType === "SAKIT" ? "SAKIT" : "IZIN";

    // 1. Update Surat menjadi DITERIMA
    const updatedNotes = JSON.stringify({
      ...parsedNotes,
      statusApproval: "DISETUJUI",
      approvedById: session.id,
      approvedByName: session.name,
      approvedAt: new Date().toISOString(),
    });

    await prisma.letter.update({
      where: { id: letterId },
      data: {
        status: "DITERIMA",
        notes: updatedNotes,
      },
    });

    // 2. Update AttendanceRecord anggota pada sesi latihan ini
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        meetingId_memberId: { meetingId, memberId },
      },
    });

    if (existingRecord) {
      await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: finalStatus,
          notes: `Izin Disetujui via Surat ${letter.letterNumber}: ${reason || ""}`,
          recordedById: session.id,
        },
      });

      await prisma.attendanceAuditLog.create({
        data: {
          meetingId,
          memberId,
          previousStatus: existingRecord.status,
          newStatus: finalStatus,
          changedById: session.id,
          reason: `Persetujuan Surat Izin: ${letter.letterNumber}`,
        },
      }).catch(() => {});
    } else {
      await prisma.attendanceRecord.create({
        data: {
          meetingId,
          memberId,
          status: finalStatus,
          notes: `Izin Disetujui via Surat ${letter.letterNumber}: ${reason || ""}`,
          recordedById: session.id,
        },
      });

      await prisma.attendanceAuditLog.create({
        data: {
          meetingId,
          memberId,
          previousStatus: "BELUM_DIISI",
          newStatus: finalStatus,
          changedById: session.id,
          reason: `Persetujuan Surat Izin Awal: ${letter.letterNumber}`,
        },
      }).catch(() => {});
    }

    // 3. Batalkan/hapus tagihan denda Alpa yang belum lunas jika sebelumnya ada
    try {
      const { syncFinesForMeeting } = await import("@/actions/fines");
      await syncFinesForMeeting(meetingId, [{ memberId, status: finalStatus }]);
    } catch (e) {
      console.error("Sync fine after leave approval error:", e);
    }

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "SETUJUI_SURAT_IZIN",
        module: "SURAT",
        details: `Menyetujui izin ${finalStatus} untuk ${parsedNotes.memberName}: ${letter.letterNumber}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/letters");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Approve leave error:", err);
    return { success: false, error: "Gagal memproses persetujuan izin." };
  }
}

/**
 * Penolakan Surat Izin oleh Admin / Sekretaris
 * Otomatis menjadikan status anggota ALPA jika tidak hadir dan menerapkan denda Alpa.
 */
export async function rejectLeavePermitAction(letterId: string, rejectionReason?: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Pembina/Admin dan Sekretaris yang berwenang menolak surat izin." };
  }

  try {
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
    });
    if (!letter) {
      return { success: false, error: "Data surat permohonan izin tidak ditemukan." };
    }

    let parsedNotes: any = null;
    try {
      parsedNotes = letter.notes ? JSON.parse(letter.notes) : null;
    } catch {}

    if (!parsedNotes || !parsedNotes.isAttendanceLeave || !parsedNotes.memberId || !parsedNotes.meetingId) {
      return { success: false, error: "Format surat permohonan izin tidak valid." };
    }

    const { memberId, meetingId } = parsedNotes;

    // 1. Update Surat menjadi DITOLAK
    const updatedNotes = JSON.stringify({
      ...parsedNotes,
      statusApproval: "DITOLAK",
      rejectionReason: rejectionReason?.trim() || "Permohonan izin tidak disetujui / tidak memenuhi syarat",
      rejectedById: session.id,
      rejectedByName: session.name,
      rejectedAt: new Date().toISOString(),
    });

    await prisma.letter.update({
      where: { id: letterId },
      data: {
        status: "DITOLAK",
        notes: updatedNotes,
      },
    });

    // 2. Sesuaikan status presensi: Jika sebelumnya berstatus IZIN/SAKIT dari permohonan yang ditolak, ubah ke ALPA
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        meetingId_memberId: { meetingId, memberId },
      },
    });

    if (existingRecord && existingRecord.status !== "HADIR") {
      await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          status: "ALPA",
          notes: `Izin Ditolak: ${rejectionReason || "Tidak disetujui"}`,
          recordedById: session.id,
        },
      });

      await prisma.attendanceAuditLog.create({
        data: {
          meetingId,
          memberId,
          previousStatus: existingRecord.status,
          newStatus: "ALPA",
          changedById: session.id,
          reason: `Surat Izin Ditolak (${letter.letterNumber}): ${rejectionReason || "-"}`,
        },
      }).catch(() => {});

      // Sinkronkan denda alpa
      try {
        const { syncFinesForMeeting } = await import("@/actions/fines");
        await syncFinesForMeeting(meetingId, [{ memberId, status: "ALPA" }]);
      } catch {}
    } else if (!existingRecord) {
      await prisma.attendanceRecord.create({
        data: {
          meetingId,
          memberId,
          status: "ALPA",
          notes: `Izin Ditolak: ${rejectionReason || "Tidak disetujui"}`,
          recordedById: session.id,
        },
      });

      try {
        const { syncFinesForMeeting } = await import("@/actions/fines");
        await syncFinesForMeeting(meetingId, [{ memberId, status: "ALPA" }]);
      } catch {}
    }

    // 3. Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TOLAK_SURAT_IZIN",
        module: "SURAT",
        details: `Menolak izin untuk ${parsedNotes.memberName}: ${letter.letterNumber} (${rejectionReason || "Tanpa alasan"})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/letters");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Reject leave error:", err);
    return { success: false, error: "Gagal memproses penolakan izin." };
  }
}


