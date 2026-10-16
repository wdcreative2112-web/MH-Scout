"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getSession,
  hashPassword,
} from "@/lib/auth";
import { loginSchema, changePasswordSchema } from "@/lib/validations/auth";
import { Role } from "@/types";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 60 * 1000; // 1 menit
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();

function isLoginRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = failedLoginAttempts.get(key);
  if (!entry) return false;
  if (now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    failedLoginAttempts.delete(key);
    return false;
  }
  return entry.count >= MAX_LOGIN_ATTEMPTS;
}

function registerFailedLogin(key: string) {
  const now = Date.now();
  const entry = failedLoginAttempts.get(key);
  if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
    failedLoginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    entry.count += 1;
  }
}

function resetFailedLogin(key: string) {
  failedLoginAttempts.delete(key);
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const parseResult = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!parseResult.success) {
    return {
      success: false,
      error: parseResult.error.errors[0]?.message || "Input tidak valid",
    };
  }

  const { email, password } = parseResult.data;
  const rateLimitKey = email.toLowerCase().trim();

  if (isLoginRateLimited(rateLimitKey)) {
    return {
      success: false,
      error: "Terlalu banyak percobaan login gagal. Mohon tunggu 1 menit sebelum mencoba kembali demi keamanan akun.",
    };
  }

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const alternateEmail = normalizedEmail.includes("@mhscout.id")
      ? normalizedEmail.replace("@mhscout.id", "@pramukaone.id")
      : normalizedEmail.replace("@pramukaone.id", "@mhscout.id");

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { email: alternateEmail },
        ],
      },
    });

    if (!user) {
      registerFailedLogin(rateLimitKey);
      return {
        success: false,
        error: "Email atau password salah.",
      };
    }

    if (!user.isActive) {
      return {
        success: false,
        error: "Akun Anda telah dinonaktifkan oleh Administrator. Hubungi admin untuk informasi lebih lanjut.",
      };
    }

    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      registerFailedLogin(rateLimitKey);
      return {
        success: false,
        error: "Email atau password salah.",
      };
    }

    // Login berhasil, reset counter percobaan gagal
    resetFailedLogin(rateLimitKey);

    // Resolve group info for KETUA_REGU safely
    let groupId: string | null = (user as any).groupId || null;
    let groupName: string | null = null;

    if (user.role === "KETUA_REGU" && groupId) {
      try {
        const group = await prisma.scoutGroup.findUnique({
          where: { id: groupId },
          select: { name: true },
        });
        groupName = group?.name || null;
      } catch {}
    }

    // Create session
    const token = await createSessionToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      avatar: user.avatar,
      groupId,
      groupName,
    });

    await setSessionCookie(token);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "LOGIN",
        module: "AUTENTIKASI",
        details: `Pengguna ${user.name} (${user.role}) berhasil login.`,
      },
    }).catch(() => {});

    // Role-based target dashboard
    let targetUrl = "/dashboard";
    if (user.role === "ADMIN") targetUrl = "/dashboard/admin";
    else if (user.role === "SEKRETARIS") targetUrl = "/dashboard/sekretaris";
    else if (user.role === "BENDAHARA") targetUrl = "/dashboard/bendahara";
    else if (user.role === "KETUA_REGU") targetUrl = "/dashboard/ketua-regu";

    return {
      success: true,
      redirectTo: targetUrl,
    };
  } catch (err: any) {
    console.error("Login exception:", err?.message || err);
    return {
      success: false,
      error: "Gagal memproses login karena kendala server. Silakan coba kembali atau hubungi administrator.",
    };
  }
}

export async function changePasswordAction(formData: FormData): Promise<AuthActionResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Akses ditolak: Silakan login terlebih dahulu." };
  }

  const raw = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Input password tidak valid",
    };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return { success: false, error: "Data pengguna tidak ditemukan." };
    }

    const isCurrentValid = await verifyPassword(parsed.data.currentPassword, user.password);
    if (!isCurrentValid) {
      return { success: false, error: "Password saat ini yang Anda masukkan salah." };
    }

    const hashedPassword = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userName: user.name,
        action: "UBAH_PASSWORD",
        module: "AUTENTIKASI",
        details: `Pengguna ${user.name} berhasil memperbarui kata sandi mandiri.`,
      },
    }).catch(() => {});

    return { success: true };
  } catch (err: any) {
    console.error("Gagal mengubah kata sandi:", err?.message || err);
    return { success: false, error: "Terjadi kesalahan sistem saat memperbarui kata sandi." };
  }
}

export async function logoutAction(): Promise<void> {
  const session = await getSession();
  if (session) {
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "LOGOUT",
        module: "AUTENTIKASI",
        details: `Pengguna ${session.name} logout.`,
      },
    }).catch(() => {});
  }

  await clearSessionCookie();
  redirect("/login");
}
