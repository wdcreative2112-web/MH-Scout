"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { organizationProfileSchema } from "@/lib/validations/content";

export async function updateOrganizationProfileAction(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    pangkalan: formData.get("pangkalan") as string,
    description: formData.get("description") as string,
    history: (formData.get("history") as string) || null,
    vision: (formData.get("vision") as string) || null,
    mission: (formData.get("mission") as string) || null,
    address: (formData.get("address") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    initialBalance: parseFloat(formData.get("initialBalance") as string) || 0,
  };

  const parsed = organizationProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const profile = await prisma.organizationProfile.upsert({
      where: { id: "default" },
      update: {
        name: parsed.data.name,
        pangkalan: parsed.data.pangkalan,
        description: parsed.data.description,
        history: parsed.data.history,
        vision: parsed.data.vision,
        mission: parsed.data.mission,
        address: parsed.data.address,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        initialBalance: parsed.data.initialBalance,
      },
      create: {
        id: "default",
        name: parsed.data.name,
        pangkalan: parsed.data.pangkalan,
        description: parsed.data.description,
        history: parsed.data.history,
        vision: parsed.data.vision,
        mission: parsed.data.mission,
        address: parsed.data.address,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        initialBalance: parsed.data.initialBalance,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE_PROFIL_ORGANISASI",
        module: "PENGATURAN",
        details: `Mengubah data profil organisasi: ${profile.name}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/finance");
    revalidatePath("/profil");
    revalidatePath("/");
    return {
      success: true,
      data: {
        ...profile,
        initialBalance: Number(profile.initialBalance),
      },
    };
  } catch (err: any) {
    return { success: false, error: "Gagal memperbarui profil organisasi." };
  }
}
