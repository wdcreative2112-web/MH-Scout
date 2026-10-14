"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { leaderSchema } from "@/lib/validations/group";

export async function createLeaderAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    nip: (formData.get("nip") as string) || null,
    gender: (formData.get("gender") as "L" | "P") || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    position: formData.get("position") as string,
    photo: (formData.get("photo") as string) || null,
  };

  const parsed = leaderSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const leader = await prisma.leader.create({
      data: {
        name: parsed.data.name,
        nip: parsed.data.nip,
        gender: parsed.data.gender,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        position: parsed.data.position,
        photo: parsed.data.photo,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_PEMBINA",
        module: "PEMBINA",
        details: `Menambahkan pembina: ${leader.name} (${leader.position})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/leaders");
    revalidatePath("/dashboard/groups");
    return { success: true, data: leader };
  } catch {
    return { success: false, error: "Gagal menyimpan pembina." };
  }
}

export async function updateLeaderAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    nip: (formData.get("nip") as string) || null,
    gender: (formData.get("gender") as "L" | "P") || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    position: formData.get("position") as string,
    photo: (formData.get("photo") as string) || null,
  };

  const parsed = leaderSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const leader = await prisma.leader.update({
      where: { id },
      data: {
        name: parsed.data.name,
        nip: parsed.data.nip,
        gender: parsed.data.gender,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        position: parsed.data.position,
        photo: parsed.data.photo,
      },
    });

    revalidatePath("/dashboard/leaders");
    return { success: true, data: leader };
  } catch {
    return { success: false, error: "Gagal memperbarui data pembina." };
  }
}
