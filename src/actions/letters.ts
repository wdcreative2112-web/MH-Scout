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
