"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { userManagementSchema } from "@/lib/validations/auth";

export async function createUserAction(formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as any,
    groupId: (formData.get("groupId") as string) || null,
    password: formData.get("password") as string,
    phone: (formData.get("phone") as string) || null,
    isActive: true,
  };

  const parsed = userManagementSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  if (parsed.data.role === "KETUA_REGU" && !parsed.data.groupId) {
    return { success: false, error: "Silakan pilih Regu yang dipimpin untuk akun Ketua Regu." };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });
    if (existing) {
      return { success: false, error: "Email sudah terdaftar." };
    }

    const hashedPassword = await hashPassword(parsed.data.password || "MhScout123!");

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        password: hashedPassword,
        role: parsed.data.role,
        groupId: parsed.data.groupId || null,
        phone: parsed.data.phone,
        isActive: true,
      } as any,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "TAMBAH_PENGGUNA",
        module: "PENGGUNA",
        details: `Membuat pengguna baru: ${user.name} (${user.role})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/users");
    return { success: true, data: JSON.parse(JSON.stringify(user)) };
  } catch (err: any) {
    console.error("Gagal membuat akun pengguna:", err);
    return {
      success: false,
      error: err?.message ? `Gagal membuat akun: ${err.message}` : "Gagal membuat akun pengguna. Periksa koneksi internet ke database.",
    };
  }
}

export async function toggleUserStatusAction(userId: string) {
  const session = await requireRole(["ADMIN"]);

  if (session.id === userId) {
    return { success: false, error: "Anda tidak dapat menonaktifkan akun Anda sendiri." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "Pengguna tidak ditemukan." };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "STATUS_PENGGUNA",
        module: "PENGGUNA",
        details: `${updated.isActive ? "Mengaktifkan" : "Menonaktifkan"} akun ${user.name}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal mengubah status pengguna." };
  }
}

export async function updateUserAction(userId: string, formData: FormData) {
  const session = await requireRole(["ADMIN"]);

  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    role: formData.get("role") as any,
    groupId: (formData.get("groupId") as string) || null,
    password: (formData.get("password") as string) || undefined,
    phone: (formData.get("phone") as string) || null,
    isActive: true,
  };

  const parsed = userManagementSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  if (parsed.data.role === "KETUA_REGU" && !parsed.data.groupId) {
    return { success: false, error: "Silakan pilih Regu yang dipimpin untuk akun Ketua Regu." };
  }

  try {
    const existing = await prisma.user.findFirst({
      where: {
        email: parsed.data.email.toLowerCase(),
        NOT: { id: userId },
      },
    });
    if (existing) {
      return { success: false, error: "Email sudah digunakan oleh akun lain." };
    }

    const dataToUpdate: any = {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      groupId: parsed.data.role === "KETUA_REGU" ? parsed.data.groupId : null,
      phone: parsed.data.phone,
    };

    if (parsed.data.password && parsed.data.password.trim().length >= 6) {
      dataToUpdate.password = await hashPassword(parsed.data.password.trim());
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_PENGGUNA",
        module: "PENGGUNA",
        details: `Mengubah data akun: ${updated.name} (${updated.role})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/users");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (err: any) {
    console.error("Gagal memperbarui akun:", err);
    return { success: false, error: err?.message || "Gagal memperbarui akun pengguna." };
  }
}

export async function deleteUserAction(userId: string) {
  const session = await requireRole(["ADMIN"]);

  if (session.id === userId) {
    return { success: false, error: "Anda tidak dapat menghapus akun Anda sendiri." };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            transactions: true,
            attendanceAudits: true,
          },
        },
      },
    });

    if (!targetUser) {
      return { success: false, error: "Pengguna tidak ditemukan." };
    }

    if (targetUser._count.transactions > 0) {
      return {
        success: false,
        error: `Akun ${targetUser.name} telah mencatat ${targetUser._count.transactions} transaksi kas pangkalan. Demi integritas audit keuangan, akun tidak dapat dihapus. Silakan nonaktifkan akun sebagai alternatif.`,
      };
    }

    if (targetUser._count.attendanceAudits > 0) {
      return {
        success: false,
        error: `Akun ${targetUser.name} memiliki ${targetUser._count.attendanceAudits} rekam jejak audit presensi. Demi integritas riwayat kehadiran, akun tidak dapat dihapus. Silakan nonaktifkan status akun sebagai alternatif.`,
      };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_PENGGUNA",
        module: "PENGGUNA",
        details: `Menghapus akun pengguna: ${targetUser.name} (${targetUser.email})`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/users");
    return { success: true };
  } catch (err: any) {
    console.error("Gagal menghapus pengguna:", err);
    return { success: false, error: "Gagal menghapus akun pengguna dari database." };
  }
}

