"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { transactionSchema, financeCategorySchema } from "@/lib/validations/finance";
import { uploadImage } from "@/lib/storage";

export async function createTransactionAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak: Hanya Bendahara dan Admin yang dapat mencatat transaksi keuangan." };
  }

  // Handle optional proof upload
  let proofUrl: string | null = null;
  const proofFile = formData.get("proof") as File | null;
  if (proofFile && proofFile.size > 0) {
    try {
      const uploadRes = await uploadImage(proofFile);
      proofUrl = uploadRes.url;
    } catch (err: any) {
      return { success: false, error: `Gagal mengunggah bukti: ${err.message}` };
    }
  }

  const raw = {
    date: formData.get("date") as string,
    type: formData.get("type") as "PEMASUKAN" | "PENGELUARAN",
    categoryId: formData.get("categoryId") as string,
    amount: parseFloat(formData.get("amount") as string),
    title: formData.get("title") as string,
    sourceOrRecipient: (formData.get("sourceOrRecipient") as string) || null,
    description: (formData.get("description") as string) || null,
    proofUrl,
  };

  const parsed = transactionSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const tx = await prisma.financialTransaction.create({
      data: {
        date: new Date(parsed.data.date),
        type: parsed.data.type,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        title: parsed.data.title,
        sourceOrRecipient: parsed.data.sourceOrRecipient,
        description: parsed.data.description,
        proofUrl: parsed.data.proofUrl,
        createdById: session.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "CATAT_TRANSAKSI",
        module: "KEUANGAN",
        details: `Mencatat ${tx.type} Rp ${tx.amount}: ${tx.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/bendahara");
    revalidatePath("/dashboard/admin");
    return {
      success: true,
      data: {
        ...tx,
        amount: Number(tx.amount),
      },
    };
  } catch (err: any) {
    console.error("Transaction create error:", err);
    return { success: false, error: "Gagal menyimpan transaksi keuangan." };
  }
}

export async function createCategoryAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    type: formData.get("type") as "PEMASUKAN" | "PENGELUARAN",
    description: (formData.get("description") as string) || null,
  };

  const parsed = financeCategorySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const cat = await prisma.financeCategory.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        description: parsed.data.description,
      },
    });

    revalidatePath("/dashboard/finance");
    return { success: true, data: cat };
  } catch {
    return { success: false, error: "Gagal membuat kategori transaksi." };
  }
}

export async function voidTransactionAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const tx = await prisma.financialTransaction.update({
      where: { id },
      data: { status: "BATAL" },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "BATAL_TRANSAKSI",
        module: "KEUANGAN",
        details: `Membatalkan transaksi Rp ${tx.amount}: ${tx.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/finance");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal membatalkan transaksi." };
  }
}
