import { NextResponse, NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // SEC-01 Fix: Restrict access to authenticated ADMINs or matching secret header
    const secretHeader = request.headers.get("x-sync-secret");
    const expectedSecret = process.env.DB_SYNC_SECRET || process.env.AUTH_SECRET;
    const session = await getSession();

    const isAuthorized =
      (expectedSecret && secretHeader === expectedSecret) ||
      (session && session.role === "ADMIN");

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Endpoint ini hanya untuk Administrator terotentikasi." },
        { status: 403 }
      );
    }

    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || "";
    if (!dbUrl) {
      return NextResponse.json({ success: false, error: "DATABASE_URL is missing" }, { status: 500 });
    }

    const sql = neon(dbUrl);

    // 1. Ensure enum Role has KETUA_REGU
    let enumStatus = "ok";
    try {
      await sql`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KETUA_REGU'`;
    } catch (e: any) {
      enumStatus = e.message;
    }

    // 2. Ensure User table has groupId column
    let colStatus = "ok";
    try {
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "groupId" TEXT`;
    } catch (e: any) {
      colStatus = e.message;
    }

    // 3. Ensure Foreign key constraint exists
    let fkStatus = "ok";
    try {
      await sql`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'User_groupId_fkey'
          ) THEN
            ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" 
            FOREIGN KEY ("groupId") REFERENCES "ScoutGroup"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$;
      `;
    } catch (e: any) {
      fkStatus = e.message;
    }

    // 4. Verify columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `;

    return NextResponse.json({
      success: true,
      message: "Database schema successfully synced with KETUA_REGU and groupId!",
      enumStatus,
      colStatus,
      fkStatus,
      columns,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
