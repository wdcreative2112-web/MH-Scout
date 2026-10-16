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
      // Check if bill already exists for this member, type, and period
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
    await prisma.$transaction(async (tx: any) => {
      const dues = await tx.memberDues.findUnique({
        where: { id: memberDuesId },
        include: { duesType: true, member: true },
      });
      if (!dues) {
        throw new Error("Tagihan iuran tidak ditemukan.");
      }

      const totalPaid = Number(dues.amountPaid) + validAmount;
      const isLunas = totalPaid >= Number(dues.amount);

      await tx.memberDues.update({
        where: { id: memberDuesId },
        data: {
          amountPaid: totalPaid,
          status: isLunas ? "LUNAS" : "SEBAGIAN",
          paidAt: new Date(),
          notes: notes || dues.notes,
        },
      });

      // Cari atau buat kategori kas iuran untuk konsistensi buku besar
      let category = await tx.financeCategory.findFirst({
        where: { name: { contains: "Iuran", mode: "insensitive" } },
      });

      if (!category) {
        category = await tx.financeCategory.findFirst({
          where: { type: "PEMASUKAN" },
        });
      }

      if (!category) {
        category = await tx.financeCategory.create({
          data: {
            name: "Iuran Anggota",
            type: "PEMASUKAN",
            description: "Kategori kas otomatis untuk setoran iuran anggota",
          },
        });
      }

      await tx.financialTransaction.create({
        data: {
          date: new Date(),
          type: "PEMASUKAN",
          categoryId: category.id,
          amount: validAmount,
          title: `Pembayaran ${dues.duesType.name} - ${dues.member.fullName} (${dues.periodName})`,
          sourceOrRecipient: dues.member.fullName,
          description: `Setoran iuran ${dues.periodName}${notes ? ` - ${notes}` : ""}`,
          createdById: session.id,
        },
      });
    });

    revalidatePath("/dashboard/dues");
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal mencatat pembayaran iuran:", err?.message || err);
    return { success: false, error: err?.message || "Gagal mencatat pembayaran iuran." };
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
        error: "Tagihan yang sudah memiliki riwayat pembayaran tidak dapat dihapus sembarangan demi kesesuaian kas.",
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

