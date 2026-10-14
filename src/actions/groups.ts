"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { scoutGroupSchema } from "@/lib/validations/group";

export async function createGroupAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    leaderId: (formData.get("leaderId") as string) || null,
    description: (formData.get("description") as string) || null,
  };

  const parsed = scoutGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const group = await prisma.scoutGroup.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        leaderId: parsed.data.leaderId || null,
        description: parsed.data.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_REGU",
        module: "REGU",
        details: `Membuat regu: ${group.name}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/groups");
    return { success: true, data: group };
  } catch {
    return { success: false, error: "Gagal menyimpan regu." };
  }
}

export async function updateGroupAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    name: formData.get("name") as string,
    category: formData.get("category") as string,
    leaderId: (formData.get("leaderId") as string) || null,
    description: (formData.get("description") as string) || null,
  };

  const parsed = scoutGroupSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const group = await prisma.scoutGroup.update({
      where: { id },
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        leaderId: parsed.data.leaderId || null,
        description: parsed.data.description,
      },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, data: group };
  } catch {
    return { success: false, error: "Gagal memperbarui regu." };
  }
}
