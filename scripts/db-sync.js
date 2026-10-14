// Database schema migration over Neon HTTPS (port 443)
// Bypasses port 5432 firewall/ISP blocks
const fs = require("fs");
const path = require("path");

// Load .env
const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const { neon } = require("@neondatabase/serverless");

async function sync() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.error("DATABASE_URL tidak ditemukan di .env");
    process.exit(1);
  }

  console.log("Menghubungkan ke Neon PostgreSQL melalui HTTPS port 443...");
  const sql = neon(dbUrl);

  try {
    const ping = await sql`SELECT 1 as ok, NOW() as time`;
    console.log("Koneksi database berhasil:", ping[0]);

    console.log("1. Memperbarui enum Role...");
    try {
      await sql`ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'KETUA_REGU'`;
      console.log("   ✓ Nilai 'KETUA_REGU' berhasil ditambahkan ke enum Role.");
    } catch (e) {
      console.log("   Info enum:", e.message);
    }

    console.log("2. Memperbarui tabel User...");
    try {
      await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "groupId" TEXT`;
      console.log("   ✓ Kolom 'groupId' berhasil ditambahkan ke tabel User.");
    } catch (e) {
      console.log("   Info kolom:", e.message);
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
      console.log("   ✓ Foreign key 'User_groupId_fkey' berhasil diverifikasi.");
    } catch (e) {
      console.log("   Info foreign key:", e.message);
    }

    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User'
      ORDER BY ordinal_position
    `;
    console.log("Struktur kolom tabel User saat ini:");
    columns.forEach((c) => console.log(`   - ${c.column_name} (${c.data_type})`));

    console.log("\nSinkronisasi database selesai dengan sukses!");
  } catch (err) {
    console.error("Gagal melakukan sinkronisasi database:", err);
    process.exit(1);
  }
}

sync();
