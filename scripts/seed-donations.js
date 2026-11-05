// scripts/seed-donations.js
// Migrates campaigns, donations, and accounts from donations.json into PostgreSQL
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

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL not found in .env");
    process.exit(1);
  }

  const sql = neon(dbUrl);
  const jsonPath = path.resolve(__dirname, "..", "src", "data", "donations.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("donations.json not found at:", jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw);

  // 1. Get an existing admin user id for verifiedById foreign key fallback
  const users = await sql`SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`;
  const defaultAdminId = users.length > 0 ? users[0].id : null;
  console.log("Default admin ID for fallback:", defaultAdminId);

  // 2. Migrate Accounts
  console.log(`\nMigrating ${data.accounts?.length || 0} accounts...`);
  for (const acc of data.accounts || []) {
    try {
      const existing = await sql`
        SELECT id FROM "DonationAccount" 
        WHERE id = ${acc.id} OR "accountNumber" = ${acc.accountNumber}
        LIMIT 1
      `;
      if (existing.length === 0) {
        await sql`
          INSERT INTO "DonationAccount" (
            id, "bankName", "accountNumber", "accountHolder", 
            "qrImageUrl", "description", "isActive", "sortOrder", 
            "createdAt", "updatedAt"
          ) VALUES (
            ${acc.id}, ${acc.bankName}, ${acc.accountNumber}, ${acc.accountHolder},
            ${acc.qrImageUrl || null}, ${acc.description || null}, ${acc.isActive ?? true}, ${acc.sortOrder || 1},
            NOW(), NOW()
          )
        `;
        console.log(`  + Inserted account: ${acc.bankName} (${acc.accountNumber})`);
      } else {
        console.log(`  = Account already exists: ${acc.bankName} (${acc.accountNumber})`);
      }
    } catch (e) {
      console.error(`  ! Error inserting account ${acc.bankName}:`, e.message);
    }
  }

  // 3. Migrate Campaigns
  console.log(`\nMigrating ${data.campaigns?.length || 0} campaigns...`);
  for (const c of data.campaigns || []) {
    try {
      const existing = await sql`
        SELECT id FROM "DonationCampaign" 
        WHERE id = ${c.id} OR slug = ${c.slug}
        LIMIT 1
      `;
      if (existing.length === 0) {
        await sql`
          INSERT INTO "DonationCampaign" (
            id, title, slug, category, description,
            "targetAmount", "collectedAmount", "donorCount",
            "startDate", "endDate", "coverImage", status,
            "isFeatured", "createdAt", "updatedAt"
          ) VALUES (
            ${c.id}, ${c.title}, ${c.slug}, ${c.category || "Sarana & Prasarana"}, ${c.description || ""},
            ${Number(c.targetAmount)}, ${Number(c.collectedAmount || 0)}, ${Number(c.donorCount || 0)},
            ${new Date(c.startDate)}, ${c.endDate ? new Date(c.endDate) : null}, ${c.coverImage || null}, ${c.status || "ACTIVE"},
            ${Boolean(c.isFeatured)}, ${new Date(c.createdAt || Date.now())}, ${new Date(c.updatedAt || Date.now())}
          )
        `;
        console.log(`  + Inserted campaign: ${c.title} (slug: ${c.slug})`);
      } else {
        console.log(`  = Campaign already exists: ${c.title}`);
      }
    } catch (e) {
      console.error(`  ! Error inserting campaign ${c.title}:`, e.message);
    }
  }

  // 4. Migrate Donations
  console.log(`\nMigrating ${data.donations?.length || 0} donations...`);
  for (const d of data.donations || []) {
    try {
      const existing = await sql`
        SELECT id FROM "Donation" 
        WHERE id = ${d.id} OR "donationNumber" = ${d.donationNumber}
        LIMIT 1
      `;
      if (existing.length === 0) {
        // Check if verifiedById exists in User table
        let verifiedById = d.verifiedById;
        if (verifiedById) {
          const userCheck = await sql`SELECT id FROM "User" WHERE id = ${verifiedById} LIMIT 1`;
          if (userCheck.length === 0) {
            verifiedById = defaultAdminId;
          }
        }

        // Check if campaignId exists
        let campaignId = d.campaignId;
        if (campaignId) {
          const campCheck = await sql`SELECT id FROM "DonationCampaign" WHERE id = ${campaignId} LIMIT 1`;
          if (campCheck.length === 0) {
            campaignId = null;
          }
        }

        await sql`
          INSERT INTO "Donation" (
            id, "donationNumber", "campaignId", "donorName", "isAnonymous",
            "donorEmail", "donorPhone", amount, "paymentMethod", "bankName",
            "proofUrl", status, message, "verifiedAt", "verifiedById",
            "rejectionReason", "createdAt", "updatedAt"
          ) VALUES (
            ${d.id}, ${d.donationNumber}, ${campaignId}, ${d.donorName || "Hamba Allah"}, ${Boolean(d.isAnonymous)},
            ${d.donorEmail || null}, ${d.donorPhone || null}, ${Number(d.amount)}, ${d.paymentMethod || "TRANSFER_BANK"}, ${d.bankName || null},
            ${d.proofUrl || null}, ${d.status || "PENDING"}, ${d.message || null},
            ${d.verifiedAt ? new Date(d.verifiedAt) : null}, ${verifiedById || null},
            ${d.rejectionReason || null}, ${new Date(d.createdAt || Date.now())}, ${new Date(d.updatedAt || Date.now())}
          )
        `;
        console.log(`  + Inserted donation: ${d.donationNumber} - ${d.donorName} (Rp ${d.amount})`);
      } else {
        console.log(`  = Donation already exists: ${d.donationNumber}`);
      }
    } catch (e) {
      console.error(`  ! Error inserting donation ${d.donationNumber}:`, e.message);
    }
  }

  console.log("\nMigration completed successfully!");
}

main().catch(console.error);

