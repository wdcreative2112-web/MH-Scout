import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
