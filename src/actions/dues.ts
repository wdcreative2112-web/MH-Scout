"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { duesTypeSchema, memberDuesPaymentSchema } from "@/lib/validations/finance";

export async function createDuesTypeAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    period: (formData.get("period") as any) || "BULANAN",
    description: (formData.get("description") as string) || null,
  };

  const parsed = duesTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const duesType = await prisma.duesType.create({
      data: {
        name: parsed.data.name,
        amount: parsed.data.amount,
        period: parsed.data.period,
        description: parsed.data.description,
      },
    });

    revalidatePath("/dashboard/dues");
    return {
      success: true,
      data: {
        ...duesType,
        amount: Number(duesType.amount),
      },
    };
  } catch {
    return { success: false, error: "Gagal membuat jenis iuran." };
  }
}

export async function generateMemberDuesBillAction(duesTypeId: string, periodName: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const duesType = await prisma.duesType.findUnique({ where: { id: duesTypeId } });
    if (!duesType) return { success: false, error: "Jenis iuran tidak ditemukan." };

    const activeMembers = await prisma.member.findMany({
      where: { status: "AKTIF" },
    });

    let count = 0;
    for (const member of activeMembers) {
      const existing = await prisma.memberDues.findFirst({
        where: {
          duesTypeId,
          memberId: member.id,
          periodName,
        },
      });

      if (!existing) {
        await prisma.memberDues.create({
          data: {
            duesTypeId,
            memberId: member.id,
            periodName,
            amount: duesType.amount,
            amountPaid: 0,
            status: "BELUM_LUNAS",
          },
        });
        count++;
      }
    }

    revalidatePath("/dashboard/dues");
    return { success: true, count };
  } catch {
    return { success: false, error: "Gagal membuat tagihan iuran massal." };
  }
}

/**
 * Catat pembayaran/angsuran iuran anggota & catat otomatis ke transaksi kas (PEMASUKAN)
 */
export async function payMemberDuesAction(memberDuesId: string, amountPaid: number, notes?: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak: Hanya Bendahara dan Admin yang dapat mencatat pembayaran iuran." };
  }

  const validation = memberDuesPaymentSchema.safeParse({
    memberDuesId,
    amountPaid,
    notes,
  });

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Nominal pembayaran tidak valid",
    };
  }

  const validAmount = validation.data.amountPaid;

  try {
    let resultRef = "";
    let isLunasResult = false;

    await prisma.$transaction(async (tx: any) => {
      const dues = await tx.memberDues.findUnique({
        where: { id: memberDuesId },
        include: { duesType: true, member: true },
      });
      if (!dues) {
        throw new Error("Tagihan iuran tidak ditemukan.");
      }

      const billTotal = Number(dues.amount);
      const currentPaid = Number(dues.amountPaid);
      const remaining = Math.max(0, billTotal - currentPaid);

      if (remaining <= 0) {
        throw new Error("Tagihan iuran ini sudah berstatus LUNAS.");
      }

      // Pastikan nominal bayar tidak melebihi sisa tagihan jika overpaid
      const actualAmountPaid = Math.min(validAmount, remaining > 0 ? remaining : validAmount);
      const totalPaid = currentPaid + actualAmountPaid;
      const isLunas = totalPaid >= billTotal;
      isLunasResult = isLunas;

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const referenceNo = `IUR-${dateStr}-${randomSuffix}`;
      resultRef = referenceNo;

      // 1. Update status tagihan iuran
      await tx.memberDues.update({
        where: { id: memberDuesId },
        data: {
          amountPaid: totalPaid,
          status: isLunas ? "LUNAS" : "SEBAGIAN",
          paidAt: now,
          notes: notes ? (dues.notes ? `${dues.notes} | ${notes}` : notes) : dues.notes,
        },
      });

      // 2. Dapatkan atau buat kategori kas "Iuran Wajib Anggota"
      let category = await tx.financeCategory.findFirst({
        where: {
          type: "PEMASUKAN",
          name: { contains: "Iuran", mode: "insensitive" },
        },
      });

      if (!category) {
        category = await tx.financeCategory.findFirst({
          where: { type: "PEMASUKAN" },
        });
      }

      if (!category) {
        category = await tx.financeCategory.create({
          data: {
            id: "cat-iuran",
            name: "Iuran Wajib Anggota",
            type: "PEMASUKAN",
            description: "Pemasukan kas otomatis dari setoran iuran anggota",
          },
        });
      }

      // 3. Catat transaksi kas pemasukan secara otomatis
      const statusKet = isLunas ? "Lunas" : `Angsuran (${totalPaid.toLocaleString("id-ID")}/${billTotal.toLocaleString("id-ID")})`;
      await tx.financialTransaction.create({
        data: {
          referenceNo,
          date: now,
          type: "PEMASUKAN",
          categoryId: category.id,
          amount: actualAmountPaid,
          title: `Iuran: ${dues.duesType.name} - ${dues.member.fullName} (${dues.periodName})`,
          sourceOrRecipient: dues.member.fullName,
          description: `Setoran iuran ${dues.duesType.name} periode ${dues.periodName} [Status: ${statusKet}]. Ref: ${referenceNo}${notes ? ` - Catatan: ${notes}` : ""}`,
          status: "VALID",
          createdById: session.id,
        },
      });

      // 4. Catat riwayat audit
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: isLunas ? "PELUNASAN_IURAN" : "PEMBAYARAN_IURAN",
          module: "IURAN",
          details: `${isLunas ? "Pelunasan" : "Pembayaran"} iuran ${dues.duesType.name} (${dues.periodName}) untuk ${dues.member.fullName} sebesar Rp ${actualAmountPaid.toLocaleString("id-ID")}. Tercatat di kas pemasukan ref [${referenceNo}].`,
        },
      }).catch(() => {});
    });

    revalidatePath("/dashboard/dues");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/bendahara");

    return {
      success: true,
      isLunas: isLunasResult,
      referenceNo: resultRef,
      message: isLunasResult
        ? `Iuran berhasil dilunaskan! Pemasukan kas telah dicatat otomatis [Ref: ${resultRef}].`
        : `Pembayaran iuran berhasil dicatat ke kas masuk [Ref: ${resultRef}].`,
    };
  } catch (err: any) {
    console.error("Gagal mencatat pembayaran iuran:", err?.message || err);
    return { success: false, error: err?.message || "Gagal mencatat pembayaran iuran." };
  }
}

/**
 * Lunaskan langsung sisa tagihan iuran anggota (1-Click Settle) & otomatis masuk kas
 */
export async function settleMemberDuesAction(memberDuesId: string, notes?: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak: Hanya Bendahara dan Admin yang dapat melunasi iuran." };
  }

  try {
    const dues = await prisma.memberDues.findUnique({
      where: { id: memberDuesId },
    });
    if (!dues) return { success: false, error: "Tagihan iuran tidak ditemukan." };

    const remaining = Math.max(0, Number(dues.amount) - Number(dues.amountPaid));
    if (remaining <= 0) {
      return { success: false, error: "Tagihan ini sudah berstatus LUNAS." };
    }

    return await payMemberDuesAction(memberDuesId, remaining, notes || "Pelunasan penuh iuran");
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal melunasi iuran." };
  }
}

/**
 * Batalkan seluruh pembayaran iuran anggota (Rollback / Void Kas Otomatis)
 */
export async function resetMemberDuesPaymentAction(memberDuesId: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak: Hanya Bendahara dan Admin yang dapat membatalkan pembayaran iuran." };
  }

  try {
    await prisma.$transaction(async (tx: any) => {
      const dues = await tx.memberDues.findUnique({
        where: { id: memberDuesId },
        include: { duesType: true, member: true },
      });
      if (!dues) throw new Error("Tagihan iuran tidak ditemukan.");

      if (Number(dues.amountPaid) === 0) {
        throw new Error("Tagihan ini belum memiliki pembayaran untuk dibatalkan.");
      }

      // 1. Batalkan semua transaksi kas pemasukan yang berkaitan dengan anggota & periode ini
      await tx.financialTransaction.updateMany({
        where: {
          referenceNo: { startsWith: "IUR-" },
          sourceOrRecipient: dues.member.fullName,
          title: { contains: dues.periodName },
          status: "VALID",
        },
        data: {
          status: "BATAL",
          description: `Dibatalkan otomatis karena reset pembayaran iuran ${dues.periodName} oleh bendahara.`,
        },
      });

      // 2. Reset status tagihan iuran menjadi BELUM_LUNAS
      await tx.memberDues.update({
        where: { id: memberDuesId },
        data: {
          amountPaid: 0,
          status: "BELUM_LUNAS",
          paidAt: null,
          notes: "Pembayaran sebelumnya telah dibatalkan/direset oleh bendahara.",
        },
      });

      // 3. Catat riwayat audit
      await tx.auditLog.create({
        data: {
          userId: session.id,
          userName: session.name,
          action: "RESET_IURAN",
          module: "IURAN",
          details: `Membatalkan seluruh setoran iuran ${dues.duesType.name} (${dues.periodName}) untuk ${dues.member.fullName}. Seluruh transaksi kas terkait telah otomatis diubah menjadi BATAL.`,
        },
      }).catch(() => {});
    });

    revalidatePath("/dashboard/dues");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
    revalidatePath("/dashboard/bendahara");

    return { success: true, message: "Pembayaran iuran berhasil dibatalkan dan pencatatan kas telah disesuaikan." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal membatalkan pembayaran iuran." };
  }
}

export async function updateDuesTypeAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    amount: parseFloat(formData.get("amount") as string),
    period: (formData.get("period") as any) || "BULANAN",
    description: (formData.get("description") as string) || null,
  };

  const parsed = duesTypeSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const duesType = await prisma.duesType.update({
      where: { id },
      data: {
        name: parsed.data.name,
        amount: parsed.data.amount,
        period: parsed.data.period,
        description: parsed.data.description,
      },
    });

    revalidatePath("/dashboard/dues");
    return {
      success: true,
      data: {
        ...duesType,
        amount: Number(duesType.amount),
      },
    };
  } catch {
    return { success: false, error: "Gagal memperbarui jenis iuran." };
  }
}

export async function deleteDuesTypeAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const duesCount = await prisma.memberDues.count({
      where: { duesTypeId: id },
    });

    if (duesCount > 0) {
      return {
        success: false,
        error: `Jenis iuran ini telah memiliki ${duesCount} tagihan anggota. Nonaktifkan status iuran alih-alih menghapusnya demi arsip data.`,
      };
    }

    await prisma.duesType.delete({
      where: { id },
    });

    revalidatePath("/dashboard/dues");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus jenis iuran." };
  }
}

export async function toggleDuesTypeActiveAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const duesType = await prisma.duesType.findUnique({ where: { id } });
    if (!duesType) return { success: false, error: "Jenis iuran tidak ditemukan." };

    await prisma.duesType.update({
      where: { id },
      data: { isActive: !duesType.isActive },
    });

    revalidatePath("/dashboard/dues");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mengubah status aktif jenis iuran." };
  }
}

export async function deleteMemberDuesAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const bill = await prisma.memberDues.findUnique({
      where: { id },
    });

    if (!bill) {
      return { success: false, error: "Tagihan iuran tidak ditemukan." };
    }

    if (Number(bill.amountPaid) > 0) {
      return {
        success: false,
        error: "Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dihapus sembarangan demi kesesuaian kas. Gunakan fitur Reset Pembayaran jika perlu membatalkan setoran.",
      };
    }

    await prisma.memberDues.delete({
      where: { id },
    });

    revalidatePath("/dashboard/dues");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal membatalkan tagihan iuran." };
  }
}
