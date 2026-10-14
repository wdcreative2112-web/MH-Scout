"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { activitySchema } from "@/lib/validations/activity";

export async function createActivityAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    title: formData.get("title") as string,
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || null,
    startDate: formData.get("startDate") as string,
    endDate: (formData.get("endDate") as string) || null,
    location: (formData.get("location") as string) || null,
    status: (formData.get("status") as any) || "TERJADWAL",
    isPublic: formData.get("isPublic") === "true",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = activitySchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const act = await prisma.activity.create({
      data: {
        title: parsed.data.title,
        category: parsed.data.category,
        description: parsed.data.description,
        startDate: new Date(parsed.data.startDate),
        endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
        location: parsed.data.location,
        status: parsed.data.status,
        isPublic: parsed.data.isPublic,
        notes: parsed.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_KEGIATAN",
        module: "KEGIATAN",
        details: `Membuat kegiatan: ${act.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/activities");
    revalidatePath("/");
    return { success: true, data: act };
  } catch {
    return { success: false, error: "Gagal menyimpan kegiatan." };
  }
}

export async function updateActivityStatusAction(id: string, status: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    await prisma.activity.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/dashboard/activities");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui status kegiatan." };
  }
}
