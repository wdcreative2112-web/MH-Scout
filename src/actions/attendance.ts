"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import {
  meetingSchema,
  updateMeetingSchema,
  recurringMeetingSchema,
  batchAttendanceSaveSchema,
  RecurringMeetingInput,
} from "@/lib/validations/activity";

/**
 * Buat pertemuan latihan tunggal (Admin & Sekretaris)
 */
export async function createMeetingAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    title: formData.get("title") as string,
    meetingDate: formData.get("meetingDate") as string,
    startTime: (formData.get("startTime") as string) || null,
    endTime: (formData.get("endTime") as string) || null,
    location: (formData.get("location") as string) || "Pangkalan",
    agenda: (formData.get("agenda") as string) || null,
    status: (formData.get("status") as any) || "TERJADWAL",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = meetingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const meeting = await prisma.attendanceMeeting.create({
      data: {
        title: parsed.data.title,
        meetingDate: new Date(parsed.data.meetingDate),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        location: parsed.data.location,
        agenda: parsed.data.agenda,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_PERTEMUAN",
        module: "ABSENSI",
        details: `Membuat jadwal latihan: ${meeting.title} (${meeting.meetingDate.toISOString().split("T")[0]})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true, data: meeting };
  } catch (err) {
    return { success: false, error: "Gagal membuat jadwal pertemuan." };
  }
}

/**
 * Perbarui informasi atau status pertemuan latihan (Admin & Sekretaris)
 */
export async function updateMeetingAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const id = formData.get("id") as string;
  if (!id) {
    return { success: false, error: "ID pertemuan tidak ditemukan." };
  }

  const raw = {
    id,
    title: formData.get("title") as string,
    meetingDate: formData.get("meetingDate") as string,
    startTime: (formData.get("startTime") as string) || null,
    endTime: (formData.get("endTime") as string) || null,
    location: (formData.get("location") as string) || "Pangkalan",
    agenda: (formData.get("agenda") as string) || null,
    status: (formData.get("status") as any) || "TERJADWAL",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = updateMeetingSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const existing = await prisma.attendanceMeeting.findUnique({ where: { id: parsed.data.id } });
    if (!existing) return { success: false, error: "Pertemuan tidak ditemukan." };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const mDate = new Date(existing.meetingDate);
    const sessionDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate(), 0, 0, 0, 0);

    if (sessionDay.getTime() < today.getTime() && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak: Jadwal pertemuan lampau telah diarsipkan. Hanya Admin yang berwenang mengubah jadwal lampau.",
      };
    }

    const meeting = await prisma.attendanceMeeting.update({
      where: { id: parsed.data.id },
      data: {
        title: parsed.data.title,
        meetingDate: parsed.data.meetingDate ? new Date(parsed.data.meetingDate) : undefined,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        location: parsed.data.location,
        agenda: parsed.data.agenda,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_PERTEMUAN",
        module: "ABSENSI",
        details: `Mengubah jadwal latihan: ${meeting.title} [Status: ${meeting.status}]`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true, data: meeting };
  } catch (err) {
    return { success: false, error: "Gagal memperbarui jadwal pertemuan." };
  }
}

/**
 * Ubah status pertemuan secara cepat (TERJADWAL / SELESAI / DIBATALKAN)
 */
export async function toggleMeetingStatusAction(
  meetingId: string,
  status: "TERJADWAL" | "SELESAI" | "DIBATALKAN"
) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const existing = await prisma.attendanceMeeting.findUnique({ where: { id: meetingId } });
    if (!existing) return { success: false, error: "Pertemuan tidak ditemukan." };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const mDate = new Date(existing.meetingDate);
    const sessionDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate(), 0, 0, 0, 0);

    if (sessionDay.getTime() < today.getTime() && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak: Sesi latihan lampau telah diarsipkan. Hanya Admin yang berwenang mengubah status sesi lampau.",
      };
    }

    const meeting = await prisma.attendanceMeeting.update({
      where: { id: meetingId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "STATUS_PERTEMUAN",
        module: "ABSENSI",
        details: `Mengubah status pertemuan "${meeting.title}" menjadi ${status}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true, data: meeting };
  } catch (err) {
    return { success: false, error: "Gagal memperbarui status pertemuan." };
  }
}

/**
 * Hapus pertemuan latihan (Admin & Sekretaris)
 * Menghapus pertemuan beserta seluruh record absensi yang terkait secara aman
 */
export async function deleteMeetingAction(meetingId: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const meeting = await prisma.attendanceMeeting.findUnique({
      where: { id: meetingId },
      select: { id: true, title: true, meetingDate: true },
    });

    if (!meeting) {
      return { success: false, error: "Pertemuan tidak ditemukan." };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const mDate = new Date(meeting.meetingDate);
    const sessionDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate(), 0, 0, 0, 0);

    if (sessionDay.getTime() < today.getTime() && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak: Jadwal pertemuan lampau telah diarsipkan. Hanya Admin yang berwenang menghapus jadwal lampau.",
      };
    }

    // 1. Hapus log audit absensi spesifik pertemuan ini
    await prisma.attendanceAuditLog.deleteMany({
      where: { meetingId },
    }).catch(() => {});

    // 2. Hapus seluruh data presensi anggota pada pertemuan ini secara eksplisit (mencegah error FK)
    await prisma.attendanceRecord.deleteMany({
      where: { meetingId },
    }).catch(() => {});

    // 3. Hapus data pertemuan
    await prisma.attendanceMeeting.delete({
      where: { id: meetingId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_PERTEMUAN",
        module: "ABSENSI",
        details: `Menghapus jadwal pertemuan: ${meeting.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Delete meeting error:", err);
    return { success: false, error: err?.message || "Gagal menghapus jadwal pertemuan." };
  }
}

/**
 * Generator Jadwal Pertemuan Mingguan Berulang (Multi-Minggu)
 * Membuat deretan jadwal mingguan (misal 4, 8, atau 12 pertemuan berturut-turut)
 */
export async function generateRecurringMeetingsAction(data: RecurringMeetingInput) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = recurringMeetingSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const {
    startDate,
    weeksCount,
    titleTemplate,
    startTime,
    endTime,
    location,
    agenda,
    status,
  } = parsed.data;

  try {
    const baseDate = new Date(startDate);
    const createdMeetings = [];

    // Ambil nomor pertemuan terakhir yang sudah ada untuk penomoran otomatis
    const existingCount = await prisma.attendanceMeeting.count();

    for (let i = 0; i < weeksCount; i++) {
      const meetingDate = new Date(baseDate);
      meetingDate.setDate(baseDate.getDate() + i * 7);

      const meetingNumber = existingCount + i + 1;
      const title = titleTemplate.includes("{n}")
        ? titleTemplate.replace("{n}", String(meetingNumber))
        : `${titleTemplate} (${i + 1})`;

      // Cek apakah sudah ada pertemuan pada tanggal yang sama dengan judul yang sama
      const dayStart = new Date(meetingDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(meetingDate);
      dayEnd.setHours(23, 59, 59, 999);

      const existingSameDay = await prisma.attendanceMeeting.findFirst({
        where: {
          meetingDate: {
            gte: dayStart,
            lte: dayEnd,
          },
          title,
        },
      });

      if (!existingSameDay) {
        const created = await prisma.attendanceMeeting.create({
          data: {
            title,
            meetingDate,
            startTime: startTime || "14:00",
            endTime: endTime || "16:30",
            location: location || "Pangkalan",
            agenda: agenda || null,
            status: status || "TERJADWAL",
          },
        });
        createdMeetings.push(created);
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "GENERATE_JADWAL",
        module: "ABSENSI",
        details: `Membuat ${createdMeetings.length} jadwal latihan berulang otomatis (mulai ${startDate})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return {
      success: true,
      count: createdMeetings.length,
      data: createdMeetings,
    };
  } catch (err: any) {
    console.error("Generate recurring meetings error:", err);
    return { success: false, error: "Gagal membuat jadwal berulang." };
  }
}

/**
 * Simpan Data Absensi Massal (Admin, Sekretaris, Ketua Regu)
 * Ketua Regu dibatasi hanya bisa menyimpan absensi untuk anggota regunya sendiri.
 */
export async function saveBatchAttendanceAction(data: {
  meetingId: string;
  records: Array<{
    memberId: string;
    status: "HADIR" | "IZIN" | "SAKIT" | "ALPA";
    notes?: string | null;
  }>;
}) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS" && session.role !== "KETUA_REGU") {
    return { success: false, error: "Akses ditolak." };
  }

  const parsed = batchAttendanceSaveSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { meetingId, records } = parsed.data;

  // Security & Scoping check for KETUA_REGU
  if (session.role === "KETUA_REGU") {
    if (!session.groupId) {
      return {
        success: false,
        error: "Akun Anda belum terhubung dengan regu manapun. Hubungi Pembina/Admin.",
      };
    }

    const memberIds = records.map((r) => r.memberId);
    const foreignMembersCount = await prisma.member.count({
      where: {
        id: { in: memberIds },
        groupId: { not: session.groupId },
      },
    });

    if (foreignMembersCount > 0) {
      return {
        success: false,
        error: "Akses ditolak: Anda hanya diperbolehkan mengisi absensi untuk anggota regu Anda sendiri.",
      };
    }
  }

  try {
    const meeting = await prisma.attendanceMeeting.findUnique({
      where: { id: meetingId },
    });
    if (!meeting) {
      return { success: false, error: "Pertemuan latihan tidak ditemukan." };
    }

    if (meeting.status === "DIBATALKAN") {
      return { success: false, error: "Pertemuan ini telah dibatalkan dan tidak dapat diabsen." };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const mDate = new Date(meeting.meetingDate);
    const sessionDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate(), 0, 0, 0, 0);

    // 1. Sesi masa depan dilarang diisi sebelum hari H tiba (Kecuali Admin yang memiliki wewenang penuh)
    if (sessionDay.getTime() > today.getTime() && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Sesi latihan ini belum dibuka. Pengisian presensi hanya dapat dilakukan tepat pada hari pelaksanaan pertemuan yang telah ditentukan.",
      };
    }

    // 2. Sesi masa lampau KHUSUS hanya boleh diubah/dikoreksi oleh ADMIN
    const isPastSession = sessionDay.getTime() < today.getTime();
    if (isPastSession && session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak: Sesi latihan lampau telah dikunci (Read-Only). Hanya Admin yang berwenang membuka dan mengoreksi data presensi yang telah lewat.",
      };
    }

    // Ambil data absensi yang sudah tersimpan untuk pertemuan ini sekaligus (Batch Query)
    const existingRecords = await prisma.attendanceRecord.findMany({
      where: {
        meetingId,
        memberId: { in: records.map((r) => r.memberId) },
      },
    });
    const existingMap = new Map(existingRecords.map((r) => [r.memberId, r]));

    // Run database transactions for atomic persistence dengan timeout lebih aman untuk Neon Cloud
    await prisma.$transaction(
      async (tx: any) => {
        const auditLogsToCreate: any[] = [];

        for (const rec of records) {
          const existing = existingMap.get(rec.memberId);

          if (existing) {
            // Record audit log if status changed
            if (existing.status !== rec.status) {
              auditLogsToCreate.push({
                meetingId,
                memberId: rec.memberId,
                previousStatus: existing.status,
                newStatus: rec.status,
                changedById: session.id,
                reason: rec.notes || (isPastSession ? "Koreksi sesi lampau oleh Admin" : "Koreksi absensi latihan"),
              });
            }

            await tx.attendanceRecord.update({
              where: { id: existing.id },
              data: {
                status: rec.status,
                notes: rec.notes !== undefined ? rec.notes : existing.notes,
                recordedById: session.id,
              },
            });
          } else {
            await tx.attendanceRecord.create({
              data: {
                meetingId,
                memberId: rec.memberId,
                status: rec.status,
                notes: rec.notes || null,
                recordedById: session.id,
              },
            });

            auditLogsToCreate.push({
              meetingId,
              memberId: rec.memberId,
              previousStatus: "BELUM_DIISI",
              newStatus: rec.status,
              changedById: session.id,
              reason: rec.notes || (isPastSession ? "Pengisian susulan sesi lampau oleh Admin" : "Pengisian absensi awal"),
            });
          }
        }

        // Simpan log audit secara aman (tidak menggagalkan penyimpanan absensi jika audit gagal)
        if (auditLogsToCreate.length > 0) {
          try {
            await tx.attendanceAuditLog.createMany({
              data: auditLogsToCreate,
            });
          } catch (auditErr) {
            console.warn("Attendance audit log notice:", auditErr);
          }
        }

        // Update status pertemuan menjadi SELESAI jika sebelumnya masih TERJADWAL
        if (meeting.status === "TERJADWAL") {
          await tx.attendanceMeeting.update({
            where: { id: meetingId },
            data: { status: "SELESAI" },
          });
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );

    // Sinkronkan denda untuk status ALPA secara otomatis
    try {
      const { syncFinesForMeeting } = await import("@/actions/fines");
      await syncFinesForMeeting(meetingId, records);
    } catch (err) {
      console.error("Fine sync notice:", err);
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: isPastSession ? "KOREKSI_ABSENSI_LAMPAU" : "SIMPAN_ABSENSI",
        module: "ABSENSI",
        details: isPastSession
          ? `Admin mengoreksi ${records.length} data absensi pada sesi lampau ${meeting.title}`
          : `Menyimpan ${records.length} data absensi untuk ${meeting.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Save attendance error:", err);
    return { success: false, error: err?.message || "Gagal menyimpan data absensi." };
  }
}

/**
 * Perbarui pengaturan jadwal latihan rutin mingguan permanen
 */
export async function updateRoutineScheduleAction(formData: FormData): Promise<{
  success: boolean;
  data?: import("@/lib/routineSchedule").RoutineScheduleConfig;
  error?: string;
  createdCount?: number;
}> {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const dayOfWeek = parseInt(formData.get("dayOfWeek") as string, 10);
  const startTime = (formData.get("startTime") as string) || "14:00";
  const endTime = (formData.get("endTime") as string) || "16:30";
  const location = (formData.get("location") as string) || "Lapangan Utama Pangkalan";
  const titleTemplate = (formData.get("titleTemplate") as string) || "Latihan Rutin Minggu ke-{n}";
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return { success: false, error: "Pilihan hari tidak valid." };
  }

  try {
    const { saveRoutineScheduleConfig, syncRoutineMeetings, DAY_NAMES } = await import("@/lib/routineSchedule");

    const updated = await saveRoutineScheduleConfig({
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      startTime,
      endTime,
      location,
      titleTemplate,
      isActive,
      excludedDates: [], // Reset daftar pengecualian saat admin menerapkan pengaturan jadwal rutin
    });

    // Jalankan sinkronisasi agar sesi terdekat dari hari yang baru dipilih langsung terbit
    let createdCount = 0;
    if (isActive) {
      const syncResult = await syncRoutineMeetings(updated, { ignoreExcluded: true });
      createdCount = syncResult.createdCount;
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "PENGATURAN_JADWAL_RUTIN",
        module: "ABSENSI",
        details: `Mengatur jadwal rutin: Setiap Hari ${updated.dayName} (${startTime} - ${endTime}) [Status: ${isActive ? "Aktif" : "Nonaktif"}]`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard");
    return { success: true, data: updated, createdCount };
  } catch (err: any) {
    console.error("Update routine schedule error:", err);
    return { success: false, error: "Gagal menyimpan pengaturan jadwal rutin." };
  }
}

/**
 * Pemicu sinkronisasi manual sesi latihan rutin
 */
export async function syncRoutineMeetingsAction(): Promise<{
  success: boolean;
  createdCount?: number;
  error?: string;
}> {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const { syncRoutineMeetings } = await import("@/lib/routineSchedule");
    const result = await syncRoutineMeetings(undefined, { ignoreExcluded: true });
    revalidatePath("/dashboard/attendance");
    return { success: true, createdCount: result.createdCount };
  } catch (err) {
    return { success: false, error: "Gagal sinkronisasi sesi rutin." };
  }
}

