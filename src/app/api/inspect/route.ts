import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: any = {
    postgresArrayTest: null,
    adapterNeonTest: null,
    prismaTest: null,
    error: null,
  };

  try {
    const os = await import("os");
    const ifaces = os.networkInterfaces();
    result.networkInterfaces = {};
    for (const [name, addrs] of Object.entries(ifaces)) {
      if (addrs) {
        result.networkInterfaces[name] = addrs.filter(a => a.family === "IPv4").map(a => a.address);
      }
    }
  } catch (e: any) {
    result.networkInterfacesError = e.message;
  }

  try {
    const aromixDotPrisma = "D:/WEB/AROMIX-Sistem/node_modules/.prisma/client";
    if (fs.existsSync(aromixDotPrisma)) {
      result.aromixDotPrismaExists = true;
      result.aromixFiles = fs.readdirSync(aromixDotPrisma);
      const pkgPath = path.join(aromixDotPrisma, "package.json");
      if (fs.existsSync(pkgPath)) {
        result.aromixDotPrismaPkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      }
    }
  } catch (e: any) {
    result.aromixDotPrismaError = e.message;
  }

  try {
    const aromixEffect = "D:/WEB/AROMIX-Sistem/node_modules/effect";
    const pramukaEffect = "D:/WEB/PramukaOne/node_modules/effect";
    if (fs.existsSync(aromixEffect) && !fs.existsSync(pramukaEffect)) {
      fs.cpSync(aromixEffect, pramukaEffect, { recursive: true, force: true });
      result.copiedEffect = true;
    }
  } catch (e: any) {
    result.copiedEffectError = e.message;
  }

  try {
    const aromixEnvPath = "D:/WEB/AROMIX-Sistem/.env";
    if (fs.existsSync(aromixEnvPath)) {
      const aromixEnv = fs.readFileSync(aromixEnvPath, "utf-8");
      const match = aromixEnv.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
      if (match) {
        const aromixDbUrl = match[1];
        result.aromixDbUrlPrefix = aromixDbUrl.substring(0, 45) + "...";
        
        const { Pool } = await import("@neondatabase/serverless");
        const testPool: any = new (Pool as any)({ connectionString: aromixDbUrl });
        const client: any = await testPool.connect();
        const testRes = await client.query("SELECT 1 as aromix_ok");
        client.release();
        await testPool.end();
        result.aromixDbTest = { success: true, res: testRes.rows };
      }
    }
  } catch (e: any) {
    result.aromixDbTest = { success: false, error: e.message };
  }

  // Also test PramukaOne Neon HTTP & sync schema
  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL || "");
    const httpPing = await sql`SELECT 1 as http_ok, NOW() as time`;
    result.httpPing = { success: true, httpPing };

    // Run DDL migrations safely
    try {
      await sql`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KETUA_REGU'`;
    } catch (e: any) {
      result.alterTypeError = e.message;
    }

    try {
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "groupId" TEXT`;
    } catch (e: any) {
      result.alterTableError = e.message;
    }

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
      result.alterFkeyError = e.message;
    }

    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `;
    result.userColumns = columns;
  } catch (e: any) {
    result.httpPing = {
      success: false,
      error: e.message,
    };
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    const ping = await prisma.$queryRaw`SELECT 1 as connected, NOW() as current_time`;
    result.prismaTest = {
      connected: true,
      ping,
    };
  } catch (e: any) {
    result.prismaTest = {
      connected: false,
      error: e.message,
      stack: e.stack,
    };
  }

  return NextResponse.json(result);
}
