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
      return {
        success: false,
        error: "Email atau password salah.",
      };
    }

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
    console.error("Login error:", err);
    try {
      const fs = require("fs");
      fs.writeFileSync("d:/WEB/PramukaOne/login-error.log", `[${new Date().toISOString()}]\nMessage: ${err?.message}\nStack: ${err?.stack}\nCode: ${err?.code}\nMeta: ${JSON.stringify(err?.meta || {})}\n\n`, { flag: "a" });
    } catch {}
    return {
      success: false,
      error: `Gagal login: ${err?.message || err?.toString() || "Terjadi kesalahan pada server"}`,
    };
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
