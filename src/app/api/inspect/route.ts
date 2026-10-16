import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Akses ditolak" }, { status: 403 });
    }
    const meetingCount = await prisma.attendanceMeeting.count();
    return NextResponse.json({ ok: true, meetingCount });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Gagal mengambil data inspeksi" }, { status: 500 });
  }
}
