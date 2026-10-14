"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { memberSchema } from "@/lib/validations/member";

export async function createMemberAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Admin dan Sekretaris yang dapat menambah anggota." };
  }

  const rawData = {
    memberNumber: formData.get("memberNumber") as string,
    fullName: formData.get("fullName") as string,
    gender: formData.get("gender") as "L" | "P",
    classGrade: (formData.get("classGrade") as string) || null,
    scoutLevel: formData.get("scoutLevel") as string,
    groupId: (formData.get("groupId") as string) || null,
    status: (formData.get("status") as "AKTIF" | "NONAKTIF" | "ALUMNI") || "AKTIF",
    phone: (formData.get("phone") as string) || null,
    parentPhone: (formData.get("parentPhone") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const parseResult = memberSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.errors[0]?.message || "Data tidak valid" };
  }

  try {
    const existing = await prisma.member.findUnique({
      where: { memberNumber: parseResult.data.memberNumber },
    });
    if (existing) {
      return { success: false, error: "Nomor anggota sudah terdaftar. Gunakan nomor unik." };
    }

    const member = await prisma.member.create({
      data: {
        memberNumber: parseResult.data.memberNumber,
        fullName: parseResult.data.fullName,
        gender: parseResult.data.gender,
        classGrade: parseResult.data.classGrade,
        scoutLevel: parseResult.data.scoutLevel,
        groupId: parseResult.data.groupId || null,
        status: parseResult.data.status,
        phone: parseResult.data.phone,
        parentPhone: parseResult.data.parentPhone,
        notes: parseResult.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_ANGGOTA",
        module: "ANGGOTA",
        details: `Menambahkan anggota: ${member.fullName} (${member.memberNumber})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/attendance");
    return { success: true, data: member };
  } catch (err: any) {
    console.error("Create member error:", err);
    return { success: false, error: "Gagal menyimpan data anggota ke database." };
  }
}

export async function updateMemberAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const rawData = {
    memberNumber: formData.get("memberNumber") as string,
    fullName: formData.get("fullName") as string,
    gender: formData.get("gender") as "L" | "P",
    classGrade: (formData.get("classGrade") as string) || null,
    scoutLevel: formData.get("scoutLevel") as string,
    groupId: (formData.get("groupId") as string) || null,
    status: (formData.get("status") as "AKTIF" | "NONAKTIF" | "ALUMNI") || "AKTIF",
    phone: (formData.get("phone") as string) || null,
    parentPhone: (formData.get("parentPhone") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const parseResult = memberSchema.safeParse(rawData);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.errors[0]?.message || "Data tidak valid" };
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: {
        memberNumber: parseResult.data.memberNumber,
        fullName: parseResult.data.fullName,
        gender: parseResult.data.gender,
        classGrade: parseResult.data.classGrade,
        scoutLevel: parseResult.data.scoutLevel,
        groupId: parseResult.data.groupId || null,
        status: parseResult.data.status,
        phone: parseResult.data.phone,
        parentPhone: parseResult.data.parentPhone,
        notes: parseResult.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UPDATE_ANGGOTA",
        module: "ANGGOTA",
        details: `Mengubah data anggota: ${member.fullName} (${member.memberNumber})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/members");
    return { success: true, data: member };
  } catch (err: any) {
    console.error("Update member error:", err);
    return { success: false, error: "Gagal memperbarui data anggota." };
  }
}

export async function toggleMemberStatusAction(id: string, newStatus: "AKTIF" | "NONAKTIF" | "ALUMNI") {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const member = await prisma.member.update({
      where: { id },
      data: { status: newStatus },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "STATUS_ANGGOTA",
        module: "ANGGOTA",
        details: `Mengubah status anggota ${member.fullName} menjadi ${newStatus}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/members");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mengubah status anggota." };
  }
}

export async function deleteMemberAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Admin dan Sekretaris yang dapat menghapus data anggota." };
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id },
      select: { id: true, fullName: true, memberNumber: true },
    });

    if (!member) {
      return { success: false, error: "Anggota tidak ditemukan." };
    }

    // Clean up attendance audit logs referencing this member if any
    await prisma.attendanceAuditLog.deleteMany({
      where: { memberId: id },
    }).catch(() => {});

    // Delete member (cascades to attendance records, dues payments, skill progress per prisma schema)
    await prisma.member.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_ANGGOTA",
        module: "ANGGOTA",
        details: `Menghapus anggota: ${member.fullName} (${member.memberNumber})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/members");
    revalidatePath("/dashboard/attendance");
    revalidatePath("/dashboard/dues");
    revalidatePath("/dashboard/skills");
    return { success: true };
  } catch (err: any) {
    console.error("Delete member error:", err);
    return { success: false, error: "Gagal menghapus data anggota dari database." };
  }
}

