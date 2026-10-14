# MH SCOUT — Sistem Manajemen Organisasi & Kegiatan Pramuka

**MH SCOUT** adalah aplikasi web modern terpadu yang menggabungkan website publik profesional dan dashboard administrasi operasional kepramukaan untuk satu pangkalan atau gugus depan Gerakan Pramuka Indonesia.

Aplikasi ini dirancang dengan pendekatan **Mobile-First Responsive Design** agar sangat nyaman digunakan oleh Pembina dan Pengurus melalui smartphone (HP) di lapangan maupun melalui desktop komputer di kantor sekretariat.

---

## 🌟 Fitur Utama

### 1. Website Publik (Tanpa Login)
- **Beranda Modern**: Hero section berslogan Pramuka, metrik statistik aktif, ringkasan nilai Tri Satya & Dasa Darma.
- **Profil Organisasi**: Sejarah pangkalan, visi, misi, struktur pembina satuan, kontak resmi sekretariat.
- **Warta & Berita Kegiatan**: Publikasi warta aktual dengan filter kategori, pembacaan ramah mobile, dan penghitung pembaca (*views*).
- **Materi & Artikel Edukasi**: Khazanah kepramukaan (tali-temali, pionering, kompas, navigasi darat, sandi, dll).
- **Galeri Dokumentasi**: Album kegiatan perkemahan, upacara pelantikan, dan penjelajahan dengan foto beresolusi optimal.

### 2. Dashboard Administrasi (Role-Based Access Control)
Tepat tiga peran pengguna dengan hak akses aman di sisi server:
- **Admin**: Akses penuh seluruh sistem, manajemen akun pengguna (tambah akun, aktivasi/penonaktifan), profil pangkalan, dan audit log.
- **Sekretaris**: Pengelolaan anggota, regu, pembina, agenda kegiatan, pencatatan absensi mingguan, SKU/SKK, surat-menyurat, serta publikasi berita/artikel/galeri.
- **Bendahara**: Dashboard kas, pencatatan pemasukan & pengeluaran, upload bukti kwitansi, penerbitan tagihan iuran wajib, pencatatan pembayaran anggota, dan laporan keuangan.

### 3. Presensi / Absensi Latihan Mingguan (Fitur Unggulan)
- Sesuai kaidah latihan rutin satu kali per minggu.
- **Mode 1 — Semua Anggota**: Tampilan seluruh anggota aktif dalam satu sentuhan.
- **Mode 2 — Per Regu**: Filter instan berdasarkan regu penggalang atau sangga penegak.
- Tombol sentuh cepat: **H** (Hadir), **I** (Izin), **S** (Sakit), **A** (Alpa).
- Live counter real-time (jumlah Hadir, Izin, Sakit, Alpa, Belum Diisi).
- Tindakan massal: *Tandai Semua Hadir*.
- Pencegahan presensi ganda melalui unique constraint database (`meetingId_memberId`).
- Jejak audit (*AttendanceAuditLog*) saat terjadi koreksi status.
- **Rekapitulasi**: Persentase kehadiran akurat per anggota dan per pertemuan (pertemuan dibatalkan otomatis dikeluarkan dari pembagi persentase).

### 4. Pembukuan Kas & Iuran
- Rumus saldo akurat: `Saldo Akhir = Saldo Awal + Total Pemasukan - Total Pengeluaran`.
- Upload bukti transaksi/nota (disimpan melalui layer abstraksi media).
- Pembatalan transaksi aman (*void*) tanpa menghapus riwayat audit.
- Tagihan iuran massal per periode untuk anggota aktif.

---

## 🛠️ Stack Teknologi

- **Frontend & App Framework**: Next.js 15 (App Router), React 19, TypeScript (Strict Mode).
- **Styling**: Tailwind CSS dengan palet warna khusus Kepramukaan (*Forest Green*, *Emerald*, *Warm Sand/Cacao*).
- **Ikon**: Lucide React.
- **Database & ORM**: Neon PostgreSQL, Prisma ORM 5.22.
- **Autentikasi & Keamanan**: Sesi aman berbasis token cookie HTTP-only (`jose`), password hashing (`bcryptjs`), otorisasi *server-side*, sanitasi input.
- **Validasi**: Zod schemas.
- **Penyimpanan Media**: Abstraksi file upload (default folder lokal aman `public/uploads` dengan opsi integrasi Cloudinary / S3).

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat Sistem
- Node.js versi 18+ (disarankan Node.js 20 atau 22).
- Akun Neon PostgreSQL (atau database PostgreSQL lokal).

### 2. Clone Repositori & Pasang Dependensi
```bash
git clone https://github.com/username/mh-scout.git
cd mh-scout
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Buka file `.env` dan sesuaikan koneksi database Neon:
```env
# Neon PostgreSQL
DATABASE_URL="postgresql://username:password@ep-sample-pooler.ap-southeast-1.aws.neon.tech/mhscout?sslmode=require"
DIRECT_URL="postgresql://username:password@ep-sample.ap-southeast-1.aws.neon.tech/mhscout?sslmode=require"

# Secret Kunci Sesi (Gunakan string acak minimal 32 karakter)
AUTH_SECRET="kunci-rahasia-sesi-mhscout-minimal-32-karakter"

# Base URL Aplikasi
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Penyedia Penyimpanan Gambar ('local', 'cloudinary', atau 's3')
IMAGE_STORAGE_PROVIDER="local"
```

### 4. Migrasi & Generate Prisma Client
Jalankan perintah generate dan migrasi schema:
```bash
npx prisma generate
npx prisma db push
```
*(Atau gunakan `npx prisma migrate dev --name init` jika menggunakan koneksi langsung).*

### 5. Seeding Data Awal (Bootstrap Akun Petugas)
Jalankan skrip seed untuk membuat akun Admin, Sekretaris, Bendahara, contoh anggota, regu, dan pertemuan latihan:
```bash
npx tsx prisma/seed.ts
```

Akun default yang terbentuk:
| Peran | Email | Password |
|---|---|---|
| **Admin** | `admin@mhscout.id` | `AdminPramuka123!` |
| **Sekretaris** | `sekretaris@mhscout.id` | `Sekretaris123!` |
| **Bendahara** | `bendahara@mhscout.id` | `Bendahara123!` |

*(Catatan: Anda dapat langsung mengklik tombol demo di halaman login untuk mengisi email dan password secara otomatis).*

### 6. Menjalankan Server Pengembangan
```bash
npm run dev
```
Akses di browser:
- Website Publik: [http://localhost:3000](http://localhost:3000)
- Login Dashboard: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🧪 Validasi Build & Pengujian

Untuk memeriksa kelayakan kode sebelum deployment:
```bash
npm run build
```

---

## 🔒 Praktik Keamanan yang Diterapkan
1. **Tidak Ada Registrasi Publik**: Akun internal hanya dibuat oleh Admin melalui modul `/dashboard/users`.
2. **Server-Side Authorization**: Seluruh operasi database dilindungi fungsi `requireAuth()` dan `requireRole()`. Memanipulasi URL tidak akan memberikan akses liar.
3. **Password Security**: Password di-hash menggunakan `bcryptjs` dengan *salt rounds* 10.
4. **Proteksi Sesi**: Token JWT terenkripsi/bertanda tangan digital disimpan dalam cookie `HttpOnly`, `SameSite=Lax`, dan `Secure` pada mode produksi.
5. **Penyimpanan Media Aman**: Nama file gambar diubah menjadi hash acak unik untuk mencegah *path traversal*.
6. **Integritas Transaksi**: Saldo dihitung dinamis dari data transaksi nyata, bukan nilai statis di frontend.

---

## 📄 Lisensi
Hak Cipta © 2026 MH SCOUT. Dikembangkan untuk Gerakan Pramuka Indonesia.
