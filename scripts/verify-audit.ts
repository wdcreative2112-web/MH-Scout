/**
 * Audit & Regression Test Suite for MH-Scout Backend
 * Verifies that the security fixes and validations are working as expected.
 */

import { validateImage, resolveImageMimeType } from "../src/lib/storage";
import { verifyPassword, hashPassword } from "../src/lib/auth";
import { memberDuesPaymentSchema } from "../src/lib/validations/finance";
import { newsSchema, articleSchema, galleryAlbumSchema } from "../src/lib/validations/content";
import { changePasswordSchema } from "../src/lib/validations/auth";
import { normalizeAccountRecord } from "../src/lib/donations";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, failureDetail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${failureDetail ? ` -> ${failureDetail}` : ""}`);
    failed++;
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("  RUNNING BACKEND SECURITY & LOGIC AUDIT TESTS");
  console.log("==================================================\n");

  // 1. Password Verification & Hashing Tests (SEC-02)
  console.log("1. Autentikasi & Password Verification (SEC-02):");
  const testPassword = "ScoutSecretPassword123!";
  const hash = await hashPassword(testPassword);
  
  assert(await verifyPassword(testPassword, hash), "Password yang benar berhasil diverifikasi via bcrypt");
  assert(!(await verifyPassword("WrongPassword123!", hash)), "Password yang salah ditolak oleh bcrypt");
  assert(!(await verifyPassword(hash, hash)), "Bypass plaintext dengan memasukkan nilai hash langsung DITOLAK");
  assert(!(await verifyPassword("", hash)), "Input password kosong ditolak");
  assert(!(await verifyPassword(testPassword, "")), "Input hash kosong ditolak");

  // 2. Storage & Upload Validation Tests (SEC-03)
  console.log("\n2. Sanitasi & Validasi Berkas Gambar (SEC-03):");
  assert(
    validateImage({ type: "image/jpeg", size: 1024, name: "photo.jpg" }).valid,
    "Berkas JPG valid diizinkan"
  );
  assert(
    validateImage({ type: "image/png", size: 1024, name: "avatar.png" }).valid,
    "Berkas PNG valid diizinkan"
  );
  assert(
    !validateImage({ type: "image/png", size: 1024, name: "exploit.html" }).valid,
    "Berkas berkedok MIME image/png dengan ekstensi .html DITOLAK"
  );
  assert(
    !validateImage({ type: "image/jpeg", size: 1024, name: "script.php" }).valid,
    "Berkas berkedok MIME image/jpeg dengan ekstensi .php DITOLAK"
  );
  assert(
    !validateImage({ type: "image/jpeg", size: 1024, name: "vector.svg" }).valid,
    "Berkas berkedok MIME image/jpeg dengan ekstensi .svg DITOLAK"
  );
  assert(
    !validateImage({ type: "application/pdf", size: 1024, name: "doc.pdf" }).valid,
    "MIME non-gambar ditolak"
  );
  assert(
    !validateImage({ type: "image/jpeg", size: 15 * 1024 * 1024, name: "large.jpg" }).valid,
    "Ukuran file > 10MB ditolak"
  );

  // 3. Member Dues Payment Validation Tests (DATA-02)
  console.log("\n3. Validasi Nominal Pembayaran Iuran (DATA-02):");
  const validPayment = memberDuesPaymentSchema.safeParse({
    memberDuesId: "dues-123",
    amountPaid: 50000,
    notes: "Setoran tunai",
  });
  assert(validPayment.success, "Nominal setoran positif valid diterima");

  const negativePayment = memberDuesPaymentSchema.safeParse({
    memberDuesId: "dues-123",
    amountPaid: -10000,
  });
  assert(!negativePayment.success, "Nominal setoran negatif DITOLAK oleh skema Zod");

  const zeroPayment = memberDuesPaymentSchema.safeParse({
    memberDuesId: "dues-123",
    amountPaid: 0,
  });
  assert(!zeroPayment.success, "Nominal setoran 0 DITOLAK oleh skema Zod");

  // 4. Content & Gallery Schema Validations (DATA-04)
  console.log("\n4. Validasi Skema Berita, Artikel, dan Galeri (DATA-04):");
  const invalidNews = newsSchema.safeParse({
    title: "",
    summary: "pendek",
    content: "singkat",
  });
  assert(!invalidNews.success, "Berita dengan data kosong/terlalu pendek DITOLAK Zod");

  const validNews = newsSchema.safeParse({
    title: "Pelantikan Pramuka Penegak Bantara",
    summary: "Kegiatan pelantikan berlangsung khidmat di Bumi Perkemahan Cibubur.",
    content: "Upacara pelantikan dipimpin langsung oleh Kakak Ketua Majelis Pembimbing Gugus Depan...",
  });
  assert(validNews.success, "Berita dengan data lengkap diterima valid");

  const invalidAlbum = galleryAlbumSchema.safeParse({
    title: "",
  });
  assert(!invalidAlbum.success, "Album galeri tanpa judul DITOLAK Zod");

  // 5. Change Password Validation Tests (FEAT-01)
  console.log("\n5. Validasi Ubah Kata Sandi (FEAT-01):");
  const validPwd = changePasswordSchema.safeParse({
    currentPassword: "OldPassword123!",
    newPassword: "NewSecurePassword456!",
    confirmPassword: "NewSecurePassword456!",
  });
  assert(validPwd.success, "Ubah password dengan konfirmasi cocok diterima");

  const mismatchPwd = changePasswordSchema.safeParse({
    currentPassword: "OldPassword123!",
    newPassword: "NewSecurePassword456!",
    confirmPassword: "WrongConfirmation456!",
  });
  assert(!mismatchPwd.success, "Ubah password dengan konfirmasi tidak cocok DITOLAK Zod");

  // 6. Validasi Rekening Bank & QRIS Admin Upload (DON-01)
  console.log("\n6. Validasi Rekening Bank & QRIS Admin Upload (DON-01):");
  
  // Format nomor rekening bank
  const validBankNumberRegex = /^\d{5,25}$/;
  const cleanRekBsi = "7198234501".replace(/[\s-]/g, "");
  const cleanRekBca = "8415-209-381".replace(/[\s-]/g, "");
  const cleanRekMandiri = "133 0029871642".replace(/[\s-]/g, "");
  const invalidLetterRek = "BSI7198234".replace(/[\s-]/g, "");
  const invalidShortRek = "1234".replace(/[\s-]/g, "");

  assert(validBankNumberRegex.test(cleanRekBsi), "Nomor rekening BSI (10 digit angka) valid");
  assert(validBankNumberRegex.test(cleanRekBca), "Nomor rekening BCA dengan tanda hubung berhasil disanitasi & valid");
  assert(validBankNumberRegex.test(cleanRekMandiri), "Nomor rekening Mandiri dengan spasi berhasil disanitasi & valid");
  assert(!validBankNumberRegex.test(invalidLetterRek), "Nomor rekening mengandung huruf DITOLAK");
  assert(!validBankNumberRegex.test(invalidShortRek), "Nomor rekening kurang dari 5 digit DITOLAK");

  // Sanitasi dummy QRIS URL
  const sanitizedDummyAcc = normalizeAccountRecord({
    id: "acc-qris",
    bankName: "QRIS Nasional",
    accountNumber: "QRIS",
    accountHolder: "PRAMUKA MH SCOUT RESMI",
    qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=000201...",
  });
  assert(sanitizedDummyAcc.qrImageUrl === null, "URL dummy api.qrserver.com berhasil dinetralisir menjadi null");

  const uploadedAcc = normalizeAccountRecord({
    id: "acc-qris",
    bankName: "QRIS Nasional",
    accountNumber: "QRIS",
    accountHolder: "PRAMUKA MH SCOUT RESMI",
    qrImageUrl: "/uploads/1729000-qris-resmi.png",
  });
  assert(uploadedAcc.qrImageUrl === "/uploads/1729000-qris-resmi.png", "Berkas QRIS hasil upload admin dipertahankan");

  // Validasi format berkas upload QRIS
  const validQrisFile = validateImage({ type: "image/png", size: 500 * 1024, name: "qris-resmi.png" });
  assert(validQrisFile.valid, "Berkas gambar QRIS format PNG valid untuk diunggah");

  const validJpgQris = validateImage({ type: "image/jpeg", size: 800 * 1024, name: "barcode.jpg" });
  assert(validJpgQris.valid, "Berkas gambar QRIS format JPG valid untuk diunggah");

  const extFallbackQris = validateImage({ type: "", size: 400 * 1024, name: "qris.webp" });
  assert(extFallbackQris.valid, "Upload gambar QRIS dengan fallback ekstensi file WEBP diterima valid");

  const riskyQris = validateImage({ type: "image/png", size: 1024, name: "qris.php" });
  assert(!riskyQris.valid, "Berkas dengan ekstensi berisiko (.php) DITOLAK");

  console.log("\n==================================================");
  console.log(`  HASIL AKHIR: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
