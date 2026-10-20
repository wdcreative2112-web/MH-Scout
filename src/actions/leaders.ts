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

  const groupIds = (formData.getAll("groupIds") as string[]).filter(Boolean);

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

    if (groupIds.length > 0) {
      await prisma.scoutGroup.updateMany({
        where: { id: { in: groupIds } },
        data: { leaderId: leader.id },
      });
    }

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
    revalidatePath("/profil");
    revalidatePath("/");
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

  const groupIds = (formData.getAll("groupIds") as string[]).filter(Boolean);

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

    // 1. Unlink groups that were previously led by this leader but are not in the new groupIds
    await prisma.scoutGroup.updateMany({
      where: {
        leaderId: id,
        id: { notIn: groupIds },
      },
      data: {
        leaderId: null,
      },
    });

    // 2. Link selected groups to this leader
    if (groupIds.length > 0) {
      await prisma.scoutGroup.updateMany({
        where: {
          id: { in: groupIds },
        },
        data: {
          leaderId: id,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_PEMBINA",
        module: "PEMBINA",
        details: `Memperbarui pembina: ${leader.name} (${leader.position})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/leaders");
    revalidatePath("/dashboard/groups");
    revalidatePath("/profil");
    revalidatePath("/");
    return { success: true, data: leader };
  } catch {
    return { success: false, error: "Gagal memperbarui data pembina." };
  }
}

export async function deleteLeaderAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const leader = await prisma.leader.findUnique({
      where: { id },
      include: {
        groups: true,
      },
    });

    if (!leader) {
      return { success: false, error: "Data pembina tidak ditemukan." };
    }

    // Set leaderId to null on associated groups so groups are preserved
    await prisma.scoutGroup.updateMany({
      where: { leaderId: id },
      data: { leaderId: null },
    });

    await prisma.leader.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_PEMBINA",
        module: "PEMBINA",
        details: `Menghapus pembina: ${leader.name} (${leader.position})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/leaders");
    revalidatePath("/dashboard/groups");
    return { success: true };
  } catch (err: any) {
    console.error("Delete leader error:", err);
    return { success: false, error: "Gagal menghapus data pembina dari database." };
  }
}

