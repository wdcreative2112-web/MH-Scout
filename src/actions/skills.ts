"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function createSkillRequirementAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const type = formData.get("type") as "SKU" | "SKK";
  const golongan = formData.get("golongan") as string;
  const level = (formData.get("level") as string) || null;
  const number = parseInt(formData.get("number") as string, 10);
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  try {
    const item = await prisma.skillRequirement.create({
      data: { type, golongan, level, number, title, description },
    });
    revalidatePath("/dashboard/skills");
    return { success: true, data: item };
  } catch {
    return { success: false, error: "Gagal membuat butir syarat kecakapan." };
  }
}

export async function updateMemberSkillProgressAction(data: {
  memberId: string;
  requirementId: string;
  status: "BELUM" | "PROSES" | "LULUS";
  examinerName?: string;
  notes?: string;
}) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const existing = await prisma.memberSkillProgress.findUnique({
      where: {
        memberId_requirementId: {
          memberId: data.memberId,
          requirementId: data.requirementId,
        },
      },
    });

    if (existing) {
      await prisma.memberSkillProgress.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          testedAt: data.status === "LULUS" ? new Date() : existing.testedAt,
          examinerName: data.examinerName || existing.examinerName,
          notes: data.notes || existing.notes,
        },
      });
    } else {
      await prisma.memberSkillProgress.create({
        data: {
          memberId: data.memberId,
          requirementId: data.requirementId,
          status: data.status,
          testedAt: data.status === "LULUS" ? new Date() : null,
          examinerName: data.examinerName,
          notes: data.notes,
        },
      });
    }

    revalidatePath("/dashboard/skills");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui progres SKU/SKK." };
  }
}
