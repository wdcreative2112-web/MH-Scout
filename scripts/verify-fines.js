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

async function check() {
  const dbUrl = process.env.DATABASE_URL || "";
  if (!dbUrl) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    console.log("Checking DuesType and MemberDues tables in Neon DB...");
    const duesTypes = await sql`SELECT id, name, amount, period FROM "DuesType" WHERE name = 'Denda Absensi (Alpa)'`;
    console.log("DuesType 'Denda Absensi (Alpa)':", duesTypes);

    const memberDuesCount = await sql`SELECT count(*) FROM "MemberDues"`;
    console.log("Total MemberDues in DB:", memberDuesCount[0].count);

    const attendanceFines = await sql`
      SELECT md.id, md.status, md.amount, md."periodName", m."fullName", m."groupId"
      FROM "MemberDues" md
      JOIN "Member" m ON md."memberId" = m.id
      JOIN "DuesType" dt ON md."duesTypeId" = dt.id
      WHERE dt.name = 'Denda Absensi (Alpa)'
      LIMIT 10
    `;
    console.log("Existing Attendance Fines:", attendanceFines);

    console.log("✓ Database check for Denda feature completed successfully!");
  } catch (err) {
    console.error("DB check error:", err);
  }
}

check();
