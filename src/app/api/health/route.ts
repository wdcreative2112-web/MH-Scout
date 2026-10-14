import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ping = await prisma.$queryRaw`SELECT 1 as connected, NOW() as current_time`;
    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: "connected",
      message: "Database Neon berhasil terhubung!",
      ping,
      userCount,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        message: err?.message,
        code: err?.code,
      },
      { status: 500 }
    );
  }
}
