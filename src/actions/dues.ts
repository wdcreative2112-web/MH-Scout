"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { duesTypeSchema } from "@/lib/validations/finance";

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
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const dues = await prisma.memberDues.findUnique({
      where: { id: memberDuesId },
      include: { duesType: true, member: true },
    });
    if (!dues) return { success: false, error: "Tagihan tidak ditemukan." };

    const totalPaid = Number(dues.amountPaid) + amountPaid;
    const isLunas = totalPaid >= Number(dues.amount);

    await prisma.memberDues.update({
      where: { id: memberDuesId },
      data: {
        amountPaid: totalPaid,
        status: isLunas ? "LUNAS" : "SEBAGIAN",
        paidAt: new Date(),
        notes: notes || dues.notes,
      },
    });

    // Also auto-record a financial transaction into Kas
    const category = await prisma.financeCategory.findFirst({
      where: { name: { contains: "Iuran", mode: "insensitive" } },
    });

    if (category) {
      await prisma.financialTransaction.create({
        data: {
          date: new Date(),
          type: "PEMASUKAN",
          categoryId: category.id,
          amount: amountPaid,
          title: `Pembayaran ${dues.duesType.name} - ${dues.member.fullName} (${dues.periodName})`,
          sourceOrRecipient: dues.member.fullName,
          description: `Setoran iuran ${dues.periodName}`,
          createdById: session.id,
        },
      });
    }

    revalidatePath("/dashboard/dues");
    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mencatat pembayaran iuran." };
  }
}
