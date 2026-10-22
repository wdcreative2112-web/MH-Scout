"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";

/**
 * Mendapatkan atau membuat jenis iuran untuk Denda Absensi
 */
export async function getOrCreateFineDuesType(amount: number = 5000) {
  let duesType = await prisma.duesType.findFirst({
    where: { name: "Denda Absensi (Alpa)" },
  });

  if (!duesType) {
    duesType = await prisma.duesType.create({
      data: {
        name: "Denda Absensi (Alpa)",
        amount,
        period: "INSIDENTAL",
        description: "Denda ketidakhadiran tanpa keterangan (Alpa) pada latihan mingguan.",
        isActive: true,
      },
    });
  }

  return duesType;
}

/**
 * Sinkronisasi denda saat absensi disimpan:
 * - Jika status = ALPA: buat tagihan denda jika belum ada
 * - Jika status != ALPA: batalkan/hapus tagihan denda yang masih BELUM_LUNAS jika ada
 */
export async function syncFinesForMeeting(
  meetingId: string,
  records: Array<{ memberId: string; status: string }>
) {
  try {
    const meeting = await prisma.attendanceMeeting.findUnique({
      where: { id: meetingId },
      select: { id: true, title: true, meetingDate: true },
    });
    if (!meeting) return;

    const fineDuesType = await getOrCreateFineDuesType();
    const fineAmount = Number(fineDuesType.amount);
    const dateFormatted = formatDate(meeting.meetingDate);

    for (const rec of records) {
      const noteMarker = `MEETING_ID:${meetingId}`;

      // Cari denda terkait pertemuan dan anggota ini
      const existingFine = await prisma.memberDues.findFirst({
        where: {
          duesTypeId: fineDuesType.id,
          memberId: rec.memberId,
          notes: { contains: noteMarker },
        },
      });

      if (rec.status === "ALPA") {
        if (!existingFine) {
          // Buat denda baru status BELUM_LUNAS
          await prisma.memberDues.create({
            data: {
              duesTypeId: fineDuesType.id,
              memberId: rec.memberId,
              periodName: `Denda Alpa - ${dateFormatted}`,
              amount: fineAmount,
              amountPaid: 0,
              status: "BELUM_LUNAS",
              notes: `${noteMarker} | ${meeting.title}`,
            },
          });
        }
      } else {
        // Jika status sekarang bukan ALPA, tapi sebelumnya ada denda yang BELUM_LUNAS, hapus
        if (existingFine && existingFine.status === "BELUM_LUNAS") {
          await prisma.memberDues.delete({
            where: { id: existingFine.id },
          }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("Error syncing attendance fines:", err);
  }
}

/**
 * Tandai denda lunas dan masukkan ke Buku Kas Pemasukan
 */
export async function payAttendanceFineAction(fineId: string, notes?: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA" && session.role !== "SEKRETARIS") {
    return {
      success: false,
      error: "Akses ditolak: Hanya Admin, Bendahara, dan Sekretaris yang berwenang mencatat pelunasan denda.",
    };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const fine = await tx.memberDues.findUnique({
        where: { id: fineId },
        include: { duesType: true, member: true },
      });

      if (!fine) {
        throw new Error("Data denda tidak ditemukan.");
      }

      if (fine.status === "LUNAS") {
        return; // Sudah lunas
      }

      const fineAmount = Number(fine.amount);

      // 1. Update status denda menjadi LUNAS
      await tx.memberDues.update({
        where: { id: fineId },
        data: {
          amountPaid: fineAmount,
          status: "LUNAS",
          paidAt: new Date(),
          notes: notes ? `${fine.notes || ""} | ${notes}` : fine.notes,
        },
      });

      // 2. Cari atau buat Kategori Kas "Denda Absensi"
      let category = await tx.financeCategory.findFirst({
        where: { name: { contains: "Denda Absensi", mode: "insensitive" } },
      });

      if (!category) {
        category = await tx.financeCategory.create({
          data: {
            name: "Denda Absensi",
            type: "PEMASUKAN",
            description: "Pemasukan dari denda ketidakhadiran tanpa keterangan (Alpa)",
          },
        });
      }

      // 3. Catat transaksi pemasukan kas riil
      await tx.financialTransaction.create({
        data: {
          date: new Date(),
          type: "PEMASUKAN",
          categoryId: category.id,
          amount: fineAmount,
          title: `Denda Absensi - ${fine.member.fullName} (${fine.periodName})`,
          sourceOrRecipient: fine.member.fullName,
          description: `Pelunasan denda alpa latihan: ${fine.periodName}`,
          createdById: session.id,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: "PELUNASAN_DENDA",
          module: "ABSENSI",
          details: `Mencatat pelunasan denda Rp ${fineAmount.toLocaleString("id-ID")} untuk ${fine.member.fullName}`,
        },
      });
    });

    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Pay fine error:", err);
    return { success: false, error: err?.message || "Gagal mencatat pelunasan denda." };
  }
}

/**
 * Batalkan denda absensi yang belum dibayar
 */
export async function cancelAttendanceFineAction(fineId: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const fine = await prisma.memberDues.findUnique({
      where: { id: fineId },
      include: { member: true },
    });

    if (!fine) {
      return { success: false, error: "Data denda tidak ditemukan." };
    }

    if (fine.status === "LUNAS") {
      return {
        success: false,
        error: "Denda yang sudah lunas dan masuk kas tidak dapat dibatalkan langsung. Silakan sesuaikan di menu Keuangan.",
      };
    }

    await prisma.memberDues.delete({
      where: { id: fineId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "BATAL_DENDA",
        module: "ABSENSI",
        details: `Membatalkan denda alpa untuk ${fine.member.fullName}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal membatalkan denda." };
  }
}

/**
 * Perbarui tarif nominal denda per alpa
 */
export async function updateFineAmountAction(amount: number) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return {
      success: false,
      error: "Akses ditolak: Hanya Admin dan Bendahara yang berwenang mengubah tarif denda.",
    };
  }

  if (isNaN(amount) || amount < 0) {
    return { success: false, error: "Nominal denda tidak valid." };
  }

  try {
    const fineDuesType = await getOrCreateFineDuesType(amount);
    await prisma.duesType.update({
      where: { id: fineDuesType.id },
      data: { amount },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_TARIF_DENDA",
        module: "ABSENSI",
        details: `Mengubah tarif denda alpa menjadi Rp ${amount.toLocaleString("id-ID")}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/attendance");
    return { success: true, amount };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal memperbarui tarif denda." };
  }
}
