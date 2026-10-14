# MASTER PROMPT — MH SCOUT
## Sistem Manajemen Pramuka dengan Website Publik dan Dashboard Administrasi

### 1. PERAN DAN TANGGUNG JAWAB

Bertindaklah sebagai Senior Full-Stack Developer, Software Architect, UI/UX Designer, Database Engineer, dan Security Engineer yang berpengalaman membangun aplikasi web modern.

Tugasmu adalah merancang dan mengembangkan aplikasi bernama **MH SCOUT**, yaitu sistem manajemen organisasi Pramuka yang mengintegrasikan website publik dan dashboard administrasi dalam satu aplikasi.

Bangun aplikasi secara bertahap, terstruktur, aman, responsif, mudah dipelihara, dan siap dikembangkan lebih lanjut.

Jangan hanya menghasilkan desain atau mockup. Implementasikan fitur secara fungsional, termasuk database, autentikasi, validasi, pengelolaan data, hak akses, dan proses bisnis.

Jangan menganggap suatu fitur telah selesai jika hanya tampilannya yang berfungsi tetapi proses penyimpanan atau pengolahan datanya belum berjalan.

---

### 2. ATURAN UTAMA PENGEMBANGAN

Ikuti aturan berikut selama mengembangkan aplikasi.

1. Periksa struktur proyek dan kode yang sudah tersedia sebelum melakukan perubahan.
2. Jika proyek sudah memiliki kode, jangan menginisialisasi ulang atau mengganti struktur proyek tanpa alasan teknis yang kuat.
3. Jika proyek masih kosong, buat struktur aplikasi yang sesuai dengan spesifikasi ini.
4. Jangan menghapus fitur, komponen, konfigurasi, atau kode yang sudah berjalan dengan baik.
5. Jangan mengubah bagian yang tidak berhubungan dengan tugas yang sedang dikerjakan.
6. Setiap perubahan harus memiliki tujuan yang jelas dan terbatas.
7. Hindari duplikasi komponen, fungsi, validasi, dan logika bisnis.
8. Jangan membuat implementasi sementara yang kemudian dianggap sebagai fitur final.
9. Jangan menggunakan data statis sebagai pengganti database pada fitur yang seharusnya menggunakan data nyata.
10. Jangan menggunakan tombol palsu, tautan kosong, atau formulir yang tidak berfungsi.
11. Jangan mengarang API, konfigurasi, environment variable, atau metode integrasi yang belum diverifikasi.
12. Jangan menampilkan pesan sukses jika operasi database gagal.
13. Jangan menonaktifkan validasi atau keamanan untuk mengatasi error.
14. Jangan melakukan migrasi database destruktif tanpa pemeriksaan dampak dan persetujuan yang sesuai.
15. Setelah mengubah kode, jalankan pemeriksaan yang relevan dan perbaiki regresi yang ditimbulkan oleh perubahan tersebut.
16. Jangan mengklaim aplikasi siap digunakan jika build, autentikasi, atau fitur penting belum diuji.
17. Jika menemukan masalah di luar ruang lingkup tugas, jelaskan masalah tersebut dan jangan langsung mengubahnya.
18. Jika ada keputusan teknis yang belum ditentukan, pilih solusi sederhana, aman, dan konsisten dengan arsitektur proyek.

**Prinsip utama: implementasikan kebutuhan yang diminta tanpa merusak fitur lain yang sudah berfungsi.**

---

### 3. IDENTITAS DAN TUJUAN APLIKASI

Nama produk: MH SCOUT.

Jenis aplikasi: Sistem manajemen administrasi dan kegiatan Pramuka berbasis web.

Target pengguna:
- Admin.
- Sekretaris.
- Bendahara.

Anggota Pramuka tidak perlu mempunyai akun, login, atau menginstal aplikasi.

Aplikasi digunakan untuk mengelola administrasi satu organisasi atau satu pangkalan Pramuka, bukan sebagai SaaS untuk banyak organisasi.

Jangan membuat fitur multi-tenant, langganan, pembayaran paket aplikasi, atau pengelolaan banyak organisasi yang tidak diperlukan.

Tujuan utama aplikasi:
- Mempermudah pengelolaan data anggota.
- Mempermudah pengelolaan regu dan pembina.
- Mempermudah administrasi kegiatan.
- Mencatat absensi latihan mingguan.
- Mengelola pencapaian SKU dan SKK jika diperlukan.
- Mengelola pemasukan dan pengeluaran.
- Membuat laporan administrasi dan keuangan.
- Mempublikasikan berita dan artikel.
- Menampilkan galeri dokumentasi kegiatan.
- Menyediakan website publik yang profesional.
- Memusatkan pengelolaan organisasi dalam satu sistem.

Gunakan Bahasa Indonesia sebagai bahasa utama antarmuka.

---

### 4. STACK TEKNOLOGI

Gunakan stack berikut.

**Frontend dan aplikasi**
- Next.js dengan App Router.
- React.
- TypeScript dengan strict mode.
- Tailwind CSS.
- shadcn/ui untuk komponen antarmuka.
- Lucide React untuk ikon.

**Database**
- Neon PostgreSQL.
- Prisma ORM.
- Prisma Migrate untuk pengelolaan migrasi database.

**Autentikasi**
- Pilih solusi autentikasi yang kompatibel dengan versi Next.js dan Prisma yang digunakan.
- Jika menggunakan Auth.js, pastikan adapter dan konfigurasi database sesuai dengan versi yang dipilih.
- Terapkan autentikasi berbasis sesi yang aman.

**Validasi**
- Zod untuk validasi input.
- React Hook Form untuk formulir kompleks jika diperlukan.

**Pengelolaan gambar**
- Siapkan integrasi dengan layanan object storage atau image hosting yang dipilih.
- Simpan file gambar di layanan tersebut.
- Simpan URL, metadata, dan relasi gambar di Neon PostgreSQL.
- Jangan menyimpan seluruh file gambar sebagai data biner di database tanpa alasan yang jelas.

**Deployment**
- Gunakan satu aplikasi Next.js.
- Target deployment dapat menggunakan Vercel atau platform lain yang kompatibel.
- Database menggunakan Neon.
- Penyimpanan gambar menggunakan layanan terpisah.

Jangan menambahkan monorepo, Turborepo, atau pemisahan menjadi beberapa aplikasi independen.

Gunakan satu proyek aplikasi dengan modul yang terorganisasi.

Jangan menambahkan dependency yang tidak diperlukan.

Periksa dokumentasi resmi versi teknologi yang benar-benar digunakan sebelum mengimplementasikan konfigurasi yang sensitif terhadap versi.

---

### 5. ARSITEKTUR APLIKASI

PramukaOne harus mempunyai dua bagian utama.

#### A. Website publik

Website publik dapat diakses tanpa login.

Halaman:
- Beranda.
- Profil organisasi.
- Berita.
- Detail berita.
- Artikel.
- Detail artikel.
- Galeri dokumentasi.
- Detail album galeri.
- Login.

#### B. Dashboard internal

Dashboard hanya dapat diakses oleh pengguna yang telah terautentikasi dan mempunyai hak akses yang sesuai.

Dashboard mencakup:
- Ringkasan statistik.
- Manajemen pengguna.
- Manajemen anggota.
- Manajemen regu.
- Manajemen pembina.
- Manajemen kegiatan.
- Absensi mingguan.
- SKU dan SKK.
- Administrasi surat.
- Dokumentasi kegiatan.
- Keuangan.
- Laporan.
- Manajemen berita.
- Manajemen artikel.
- Manajemen galeri.
- Pengaturan aplikasi.

Website publik dan dashboard harus berada dalam satu proyek Next.js.

Gunakan layout dan komponen yang sesuai untuk masing-masing bagian.

Pisahkan logika bisnis, akses database, validasi, autentikasi, dan antarmuka agar kode mudah dipelihara.

---

### 6. DESAIN MOBILE-FIRST

Ini merupakan persyaratan utama.

**Prioritaskan tampilan mobile sebelum mengembangkan layout desktop.**

Tahap awal pengembangan harus berfokus pada pengalaman penggunaan di HP.

Gunakan pendekatan responsive design dan mobile-first.

Target awal:
- Layar HP kecil sekitar 320–375 piksel.
- HP modern sekitar 390–430 piksel.
- Tablet.
- Desktop pada tahap pengembangan berikutnya.

Jangan membuat desain desktop terlebih dahulu lalu sekadar mengecilkannya untuk HP.

#### Ketentuan UI mobile

1. Layout harus nyaman digunakan dengan satu tangan jika memungkinkan.
2. Tombol mempunyai area sentuh yang memadai.
3. Formulir tidak terlalu padat.
4. Input dan label mudah dibaca.
5. Navigasi tidak memenuhi layar.
6. Modal dan dialog harus nyaman digunakan di layar kecil.
7. Tabel panjang harus mempunyai solusi responsif.
8. Hindari overflow horizontal yang tidak disengaja.
9. Pencatatan absensi harus cepat dan efisien.
10. Formulir keuangan harus mudah digunakan melalui HP.
11. Editor berita dan artikel harus nyaman untuk penulisan konten.
12. Upload gambar harus mendukung penggunaan perangkat mobile.

#### Navigasi dashboard

Gunakan navigasi yang sesuai untuk mobile.

Pilih sidebar yang dapat dibuka sebagai drawer, bottom navigation untuk menu utama tertentu, atau kombinasi keduanya jika memang lebih sesuai.

Jangan menampilkan terlalu banyak menu dalam satu area.

Gunakan pengelompokan menu yang logis.

#### Desain desktop

Setelah versi mobile berfungsi dan stabil, kembangkan layout desktop dengan memanfaatkan komponen yang sama sejauh memungkinkan.

Jangan membuat ulang seluruh logika bisnis hanya untuk mendukung desktop.

---

### 7. IDENTITAS VISUAL

Buat tampilan profesional, bersih, modern, dan sesuai dengan karakter organisasi Pramuka.

Gunakan karakter visual berikut:

- Warna utama: hijau tua.
- Warna sekunder: hijau yang lebih terang.
- Latar: putih dan warna netral yang lembut.
- Aksen: krem atau cokelat secukupnya.
- Tipografi: modern dan mudah dibaca.
- Ikon: konsisten menggunakan Lucide React.
- Sudut komponen: proporsional dan tidak berlebihan.
- Bayangan: lembut dan digunakan seperlunya.
- Spasi: konsisten.
- Animasi: ringan dan fungsional.

Hindari:
- Gradien berlebihan.
- Terlalu banyak warna.
- Efek kaca yang berlebihan.
- Bayangan gelap yang terlalu kuat.
- Animasi yang mengganggu.
- Layout yang terlalu padat.
- Penggunaan emoji sebagai pengganti ikon profesional.
- Tampilan generik yang tidak mempunyai hierarki visual.

Jangan membuat semua halaman terlihat identik jika kebutuhan dan jenis kontennya berbeda.

Gunakan sistem desain yang konsisten, tetapi sesuaikan komponen dengan fungsi masing-masing halaman.

---

### 8. ROLE DAN HAK AKSES

Aplikasi mempunyai tepat tiga role utama.

#### A. Admin

Admin memiliki akses penuh terhadap aplikasi.

Hak akses:
- Melihat dashboard.
- Mengelola pengguna.
- Membuat dan mengubah akun.
- Mengatur role pengguna.
- Mengelola data organisasi.
- Mengelola anggota.
- Mengelola regu.
- Mengelola pembina.
- Mengelola kegiatan.
- Mengelola absensi.
- Mengelola SKU dan SKK.
- Mengelola administrasi surat.
- Mengelola keuangan sesuai kewenangan admin.
- Mengelola laporan.
- Mengelola berita.
- Mengelola artikel.
- Mengelola galeri.
- Mengelola pengaturan aplikasi.

Admin harus dapat menonaktifkan akun pengguna tanpa menghapus riwayat transaksi atau aktivitas yang terkait dengan akun tersebut.

#### B. Sekretaris

Sekretaris bertanggung jawab atas administrasi dan publikasi.

Hak akses:
- Melihat dashboard administrasi.
- Melihat dan mengelola data anggota.
- Mengelola regu.
- Mengelola data pembina.
- Mengelola jadwal kegiatan.
- Mencatat absensi.
- Mengelola pencapaian SKU dan SKK.
- Mengelola surat-menyurat.
- Mengelola dokumentasi kegiatan.
- Membuat dan mengubah berita.
- Membuat dan mengubah artikel.
- Mengelola album galeri.
- Melihat dan membuat laporan administrasi.

Sekretaris tidak boleh mengakses pengaturan sensitif pengguna atau melakukan perubahan keuangan yang tidak menjadi kewenangannya.

#### C. Bendahara

Bendahara bertanggung jawab atas administrasi keuangan.

Hak akses:
- Melihat dashboard keuangan.
- Melihat data anggota yang diperlukan untuk administrasi pembayaran.
- Mengelola data iuran.
- Mencatat pembayaran anggota.
- Mencatat pemasukan.
- Mencatat pengeluaran.
- Mengelola kategori transaksi.
- Mengunggah bukti transaksi.
- Melihat saldo.
- Membuat laporan keuangan.
- Mengekspor laporan keuangan.

Bendahara tidak boleh mengelola akun pengguna atau mengubah data administrasi yang tidak terkait dengan keuangan.

#### Ketentuan implementasi hak akses

Buat satu sistem otorisasi terpusat.

Periksa hak akses pada server untuk setiap operasi yang dilindungi.

Jangan hanya menyembunyikan tombol atau menu di frontend.

Pengguna tidak boleh mendapatkan akses tambahan hanya dengan mengubah URL, parameter permintaan, atau data formulir.

Terapkan prinsip least privilege.

---

### 9. AUTENTIKASI DAN PENGELOLAAN PENGGUNA

Buat sistem login untuk Admin, Sekretaris, dan Bendahara.

Fitur:
- Login menggunakan identitas pengguna yang sesuai.
- Logout.
- Validasi formulir.
- Penanganan kesalahan autentikasi.
- Proteksi halaman dashboard.
- Proteksi operasi server.
- Pengelolaan sesi.
- Pengelolaan role.
- Aktivasi dan penonaktifan akun.

Jangan menyediakan registrasi publik yang memungkinkan pengunjung membuat akun Admin atau akun internal sendiri.

Akun awal Admin harus dibuat melalui proses bootstrap yang aman, misalnya skrip seed atau perintah administratif yang dijalankan secara sengaja.

Jangan menanamkan password default yang diketahui publik ke dalam aplikasi produksi.

Jika menyediakan fitur reset password, gunakan mekanisme yang aman.

Jangan menyimpan password dalam bentuk teks biasa.

Gunakan metode hashing password yang sesuai jika autentikasi menggunakan password lokal.

Jangan menyimpan token rahasia atau kredensial sensitif di localStorage.

Jangan memasukkan DATABASE_URL atau kredensial penyimpanan ke dalam kode frontend.

---

### 10. LANDING PAGE

Buat landing page yang profesional dan responsif.

Halaman ini berfungsi sebagai halaman depan website organisasi Pramuka.

#### A. Navbar

Elemen:
- Logo PramukaOne.
- Beranda.
- Profil.
- Berita.
- Artikel.
- Galeri.
- Tombol Login.

Di mobile, gunakan navigasi yang ringkas.

#### B. Hero section

Tampilkan:
- Judul utama.
- Deskripsi singkat organisasi.
- Tombol menuju berita terbaru atau profil.
- Foto atau ilustrasi kegiatan Pramuka yang relevan.

Contoh judul:

"Pramuka Aktif, Berkarakter, dan Menginspirasi."

Contoh deskripsi:

"Temukan informasi kegiatan, berita, artikel, dan dokumentasi aktivitas Pramuka dalam satu website."

Jangan menampilkan klaim yang tidak dapat dibuktikan.

#### C. Profil singkat

Tampilkan:
- Deskripsi organisasi.
- Tujuan pembinaan.
- Nilai-nilai kepramukaan.
- Tautan menuju halaman profil lengkap.

Data profil sebaiknya dikelola melalui dashboard jika memungkinkan.

#### D. Berita terbaru

Tampilkan beberapa berita yang telah diterbitkan.

Setiap kartu memuat:
- Gambar utama.
- Judul.
- Tanggal.
- Ringkasan.
- Tautan baca selengkapnya.

Jangan menampilkan berita berstatus draf.

#### E. Artikel pilihan

Tampilkan artikel yang telah diterbitkan.

Gunakan layout yang nyaman dibaca di HP.

#### F. Galeri dokumentasi

Tampilkan foto-foto pilihan dari album yang telah diterbitkan.

Klik album akan membuka halaman detail album.

#### G. Informasi kegiatan

Jika modul kegiatan memiliki informasi yang layak dipublikasikan, tampilkan kegiatan mendatang yang berstatus publik.

Jangan menampilkan data internal atau informasi sensitif.

#### H. Footer

Tampilkan:
- Nama organisasi.
- Deskripsi singkat.
- Navigasi.
- Informasi kontak jika tersedia.
- Tautan media sosial jika tersedia.
- Tahun berjalan.

Jangan mengarang nomor telepon, alamat, akun media sosial, atau identitas organisasi.

Jika informasi belum tersedia, gunakan data yang dapat dikonfigurasi melalui dashboard atau tampilkan bagian tersebut secara kondisional.

---

### 11. PROFIL ORGANISASI

Buat halaman profil organisasi.

Informasi dapat mencakup:
- Nama organisasi atau pangkalan.
- Deskripsi.
- Sejarah singkat.
- Visi dan misi.
- Struktur organisasi.
- Informasi pembina.
- Kontak organisasi.

Jangan mengasumsikan bahwa semua informasi sudah tersedia.

Buat struktur yang memungkinkan informasi diperbarui melalui dashboard.

Untuk struktur organisasi, tampilkan informasi yang telah diisi oleh Admin atau Sekretaris.

Jangan menampilkan data pribadi yang tidak diperlukan untuk publik.

---

### 12. MODUL MANAJEMEN ANGGOTA

Buat modul untuk mengelola data anggota Pramuka.

Fitur:
- Menambahkan anggota.
- Melihat detail anggota.
- Mengedit data anggota.
- Menonaktifkan atau mengarsipkan anggota.
- Mencari anggota.
- Memfilter berdasarkan regu.
- Memfilter berdasarkan tingkatan.
- Memfilter berdasarkan kelas jika digunakan.
- Mengekspor data anggota sesuai izin.

Data anggota dapat mencakup:
- Nomor anggota atau identitas internal.
- Nama lengkap.
- Jenis kelamin jika diperlukan.
- Kelas.
- Regu.
- Golongan atau tingkatan Pramuka.
- Tanggal bergabung.
- Status keanggotaan.
- Catatan administratif yang diperlukan.

Hindari pengumpulan data sensitif yang tidak diperlukan.

Gunakan validasi pada seluruh input.

Cegah nomor anggota duplikat jika nomor anggota diwajibkan unik.

Anggota tidak mempunyai akun login.

Data anggota menjadi referensi untuk absensi, SKU/SKK, kegiatan, dan pembayaran iuran.

Jika anggota dinonaktifkan, jangan menghapus riwayat absensi dan transaksi historisnya.

---

### 13. MODUL REGU DAN PEMBINA

#### Manajemen regu

Fitur:
- Membuat regu.
- Mengubah data regu.
- Melihat anggota dalam regu.
- Memindahkan anggota antarregu.
- Melihat rekapitulasi anggota per regu.

Data regu:
- Nama regu.
- Jenis atau kategori regu jika diperlukan.
- Pembina yang bertanggung jawab.
- Keterangan.
- Status aktif.

Pastikan perubahan keanggotaan regu tidak mengubah riwayat absensi yang sudah tersimpan.

#### Manajemen pembina

Fitur:
- Menambah pembina.
- Mengedit data pembina.
- Melihat daftar pembina.
- Menghubungkan pembina dengan regu.
- Menonaktifkan pembina.

Jangan otomatis memberikan akun login kepada pembina karena role utama aplikasi hanya Admin, Sekretaris, dan Bendahara.

---

### 14. MODUL KEGIATAN

Buat modul untuk mencatat kegiatan Pramuka.

Data kegiatan:
- Nama kegiatan.
- Jenis kegiatan.
- Deskripsi.
- Tanggal mulai.
- Tanggal selesai jika diperlukan.
- Waktu.
- Lokasi.
- Peserta atau regu yang terlibat.
- Status kegiatan.
- Dokumentasi.
- Catatan hasil kegiatan.

Fitur:
- Membuat kegiatan.
- Mengedit kegiatan.
- Melihat detail kegiatan.
- Menandai kegiatan selesai.
- Menghubungkan kegiatan dengan absensi.
- Menghubungkan kegiatan dengan album dokumentasi.

Jenis kegiatan dapat mencakup:
- Latihan rutin.
- Perkemahan.
- Lomba.
- Pelantikan.
- Bakti sosial.
- Kegiatan lainnya.

Buat kategori yang dapat dikelola atau disesuaikan.

Jangan mewajibkan seluruh kegiatan menjadi berita publik.

Kegiatan internal hanya dapat diakses melalui dashboard sesuai hak akses.

---

### 15. MODUL ABSENSI MINGGUAN

Absensi merupakan salah satu fitur penting PramukaOne.

**Ketentuan utama: latihan rutin berlangsung satu kali setiap minggu.**

Jangan membangun sistem absensi harian sebagai alur utama.

Absensi harus terhubung dengan jadwal atau pertemuan kegiatan yang jelas.

#### A. Pembuatan jadwal

Sekretaris dapat:
- Membuat jadwal latihan.
- Menentukan tanggal.
- Menentukan waktu dan lokasi.
- Mengatur jadwal berulang mingguan.
- Mengubah jadwal untuk minggu tertentu.
- Membatalkan pertemuan yang tidak dilaksanakan.

Jadwal berulang tidak boleh menghasilkan duplikasi pertemuan untuk tanggal yang sama.

Perubahan pada jadwal berikutnya tidak boleh merusak catatan pertemuan yang sudah memiliki absensi.

#### B. Pilihan mode absensi

Sediakan dua mode:

**Mode 1: Semua Anggota**

Tampilkan seluruh anggota aktif dalam satu daftar.

**Mode 2: Per Regu**

Sekretaris memilih regu tertentu, lalu sistem menampilkan anggota aktif dalam regu tersebut.

Kedua mode harus menggunakan mekanisme penyimpanan yang konsisten.

#### C. Status kehadiran

Sediakan status:
- Hadir.
- Izin.
- Sakit.
- Alpa.

Setiap anggota hanya boleh mempunyai satu status absensi untuk satu pertemuan yang sama.

Gunakan batasan unik di database yang sesuai untuk mencegah pencatatan ganda.

#### D. Workflow absensi

1. Sekretaris membuka menu Absensi.
2. Memilih pertemuan mingguan.
3. Memilih mode Semua Anggota atau Per Regu.
4. Sistem menampilkan daftar anggota yang relevan.
5. Sekretaris mencatat status setiap anggota.
6. Sistem menghitung ringkasan kehadiran.
7. Sekretaris meninjau data.
8. Sekretaris menyimpan absensi.
9. Sistem menampilkan konfirmasi hanya jika penyimpanan berhasil.
10. Data tersedia dalam rekapitulasi.

#### E. Pengalaman pengguna

Buat absensi cepat digunakan melalui HP.

Fitur yang disarankan:
- Pencarian nama anggota.
- Filter regu.
- Penandaan status yang mudah disentuh.
- Penanda anggota yang belum diberi status.
- Ringkasan jumlah Hadir, Izin, Sakit, dan Alpa.
- Tombol simpan yang jelas.
- Konfirmasi jika pengguna meninggalkan halaman dengan perubahan yang belum disimpan.

Jangan mengubah anggota yang belum ditandai menjadi Hadir secara diam-diam.

Jika diperlukan, sediakan tindakan massal dengan konfirmasi eksplisit.

#### F. Koreksi absensi

Sekretaris dapat memperbaiki kesalahan pencatatan sesuai hak akses.

Perubahan yang penting harus memiliki jejak audit:
- Pengguna yang mengubah.
- Waktu perubahan.
- Data sebelumnya.
- Data sesudahnya.

Jangan menghapus seluruh riwayat perubahan ketika data dikoreksi.

#### G. Laporan absensi

Sediakan:
- Rekap per pertemuan.
- Rekap per anggota.
- Rekap per regu.
- Rekap bulanan.
- Rekap tahunan.
- Filter rentang tanggal.

Hitung persentase kehadiran berdasarkan aturan yang jelas dan tampilkan jumlah pertemuan yang menjadi dasar perhitungan.

Jangan memasukkan pertemuan yang dibatalkan ke penyebut persentase kehadiran.

Sediakan ekspor laporan jika sesuai dengan hak akses.

---

### 16. MODUL SKU DAN SKK

Sediakan modul pengelolaan SKU dan SKK yang dapat diaktifkan sesuai kebutuhan organisasi.

SKU adalah Syarat Kecakapan Umum.

SKK adalah Syarat Kecakapan Khusus.

Jangan mengarang daftar resmi syarat kecakapan atau mengklaim suatu data sesuai aturan resmi jika belum diverifikasi.

Struktur data sebaiknya memungkinkan materi ditambahkan, diperbarui, dan dikelompokkan berdasarkan golongan atau kategori.

Fitur:
- Daftar materi.
- Kategori atau golongan.
- Detail persyaratan.
- Pencatatan progres anggota.
- Status belum diuji, dalam proses, lulus, atau perlu pengujian ulang jika sesuai kebutuhan.
- Tanggal pengujian.
- Nama penguji atau pembina.
- Catatan penilaian.
- Rekapitulasi pencapaian.

Setiap pencapaian harus terhubung dengan anggota dan materi yang tepat.

Jangan otomatis menyatakan anggota telah menyelesaikan seluruh SKU hanya karena satu materi ditandai selesai.

---

### 17. MODUL ADMINISTRASI SURAT

Sediakan modul administrasi surat jika diperlukan.

Fitur:
- Nomor surat.
- Tanggal surat.
- Jenis surat.
- Perihal.
- Tujuan surat.
- Ringkasan isi.
- File lampiran.
- Status surat.
- Catatan administratif.

Dukung pencatatan surat masuk dan surat keluar jika diperlukan.

Nomor surat harus dapat diatur sesuai aturan organisasi.

Jangan membuat format nomor surat yang dianggap resmi tanpa konfigurasi atau aturan yang diberikan organisasi.

Jika tersedia ekspor dokumen, pastikan hasilnya dapat dibaca dan formatnya konsisten.

---

### 18. MODUL BERITA

Berita adalah publikasi mengenai peristiwa atau kegiatan yang benar-benar terjadi.

Buat halaman daftar berita dan halaman detail berita.

#### Data berita

- Judul.
- Slug unik.
- Ringkasan.
- Isi.
- Gambar utama.
- Kategori.
- Penulis.
- Waktu pembuatan.
- Waktu pembaruan.
- Waktu publikasi.
- Status publikasi.

Status minimal:
- Draf.
- Terbit.
- Diarsipkan.

#### Fitur dashboard

- Membuat berita.
- Mengedit berita.
- Menyimpan draf.
- Melihat pratinjau.
- Menerbitkan berita.
- Mengarsipkan berita.
- Mengunggah gambar utama.
- Memilih kategori.
- Mencari dan memfilter berita.

#### Fitur publik

- Daftar berita terbaru.
- Detail berita.
- Gambar utama.
- Tanggal publikasi.
- Nama penulis jika tersedia.
- Kategori.
- Berita terkait jika relevan.

Hanya berita berstatus Terbit dan sudah memenuhi waktu publikasi yang boleh ditampilkan secara publik.

Gunakan editor konten yang sesuai untuk artikel panjang.

Sanitasi konten HTML jika editor menghasilkan HTML agar tidak membuka celah XSS.

Jangan menggunakan HTML mentah dari pengguna tanpa sanitasi.

---

### 19. MODUL ARTIKEL

Artikel digunakan untuk konten edukasi dan pengetahuan kepramukaan.

Contoh topik:
- Pendidikan karakter.
- Dasa Darma dan Tri Satya.
- Tali-temali.
- Navigasi darat.
- Sejarah kepramukaan.
- Keterampilan dasar Pramuka.
- Kepemimpinan.
- Kedisiplinan.
- SKU dan SKK.

Fitur dashboard mengikuti pola modul berita:
- Membuat artikel.
- Mengedit artikel.
- Menyimpan draf.
- Pratinjau.
- Menerbitkan.
- Mengarsipkan.
- Mengelola kategori.
- Mengunggah gambar utama.

Artikel memiliki:
- Judul.
- Slug.
- Ringkasan.
- Isi.
- Gambar utama.
- Kategori.
- Penulis.
- Tanggal publikasi.
- Metadata SEO dasar.

Buat halaman daftar dan detail artikel yang responsif.

Gunakan judul yang jelas, tipografi yang nyaman, lebar kolom bacaan yang sesuai, serta jarak antarparagraf yang cukup.

---

### 20. MODUL GALERI DOKUMENTASI

Buat galeri untuk menyimpan dan menampilkan dokumentasi kegiatan.

#### A. Album

Setiap album memiliki:
- Nama album.
- Slug.
- Deskripsi.
- Tanggal kegiatan.
- Gambar sampul.
- Daftar foto.
- Status publikasi.
- Waktu pembuatan.
- Waktu pembaruan.

#### B. Pengelolaan foto

Fitur:
- Upload foto.
- Menghapus foto sesuai izin.
- Mengatur urutan foto.
- Menambahkan keterangan foto jika diperlukan.
- Memilih sampul album.
- Memindahkan foto antaralbum jika dibutuhkan.

Gunakan upload yang aman dan tervalidasi.

Periksa tipe file, ukuran file, serta hasil pemrosesan gambar.

Jangan mempercayai nama file atau content type yang dikirim oleh browser tanpa pemeriksaan.

Gunakan nama file yang aman atau identifier acak.

#### C. Halaman publik

Tampilkan:
- Daftar album.
- Sampul album.
- Nama kegiatan.
- Tanggal.
- Deskripsi singkat.
- Grid foto.
- Tampilan foto yang dapat diperbesar.

Gunakan thumbnail yang dioptimalkan.

Jangan memuat seluruh gambar beresolusi tinggi sekaligus jika jumlahnya besar.

Terapkan lazy loading dan pagination atau pemuatan bertahap sesuai kebutuhan.

#### D. Privasi dokumentasi

Karena dokumentasi dapat menampilkan anak-anak, berikan mekanisme agar pengelola hanya menerbitkan foto yang memang boleh dipublikasikan.

Jangan menampilkan foto berstatus privat melalui URL publik yang tidak terlindungi.

---

### 21. MODUL PENYIMPANAN GAMBAR

Gunakan Neon PostgreSQL untuk menyimpan data aplikasi, termasuk metadata file.

Jangan menganggap Neon sebagai layanan object storage.

Gunakan layanan penyimpanan gambar terpisah yang mendukung upload dan pengiriman gambar.

Sediakan lapisan abstraksi penyimpanan agar provider dapat diganti tanpa harus menulis ulang seluruh modul berita, artikel, dan galeri.

Contoh konsep fungsi:
- uploadImage()
- deleteImage()
- getImageUrl()
- validateImage()

Nama fungsi dapat disesuaikan dengan arsitektur proyek.

Simpan metadata gambar di database, misalnya:
- Storage key.
- URL atau informasi untuk membangun URL.
- Nama asli file jika diperlukan.
- MIME type.
- Ukuran file.
- Lebar dan tinggi gambar jika tersedia.
- Pengunggah.
- Waktu unggah.

Jangan menyimpan kredensial provider di frontend.

Jika menggunakan URL publik, pastikan hanya file yang memang ditujukan untuk publik yang dapat diakses secara publik.

Jika menggunakan penyimpanan privat, gunakan mekanisme akses sementara yang aman.

Jangan menganggap URL gambar sebagai pengganti pemeriksaan hak akses.

---

### 22. MODUL KEUANGAN

Buat modul keuangan untuk mencatat pemasukan, pengeluaran, pembayaran iuran, dan saldo organisasi.

#### A. Dashboard keuangan

Tampilkan:
- Saldo saat ini.
- Total pemasukan periode berjalan.
- Total pengeluaran periode berjalan.
- Ringkasan transaksi.
- Transaksi terbaru.
- Ringkasan iuran jika fitur iuran digunakan.

Pastikan semua angka dihitung dari data yang konsisten.

Jangan menghitung saldo hanya dari nilai yang dimasukkan secara manual pada frontend.

#### B. Kategori transaksi

Sediakan kategori yang dapat dikelola sesuai kebutuhan organisasi.

Contoh pemasukan:
- Iuran anggota.
- Dana kegiatan.
- Donasi.
- Pemasukan lainnya.

Contoh pengeluaran:
- Perlengkapan.
- Konsumsi.
- Transportasi.
- Kegiatan.
- Pengeluaran lainnya.

Kategori harus dapat ditambahkan atau disesuaikan.

#### C. Pencatatan pemasukan

Data:
- Tanggal.
- Nomor referensi jika diperlukan.
- Kategori.
- Nominal.
- Sumber pemasukan.
- Keterangan.
- Bukti transaksi.
- Pengguna pencatat.

#### D. Pencatatan pengeluaran

Data:
- Tanggal.
- Kategori.
- Nominal.
- Penerima atau tujuan.
- Keterangan.
- Bukti transaksi.
- Pengguna pencatat.

#### E. Pembayaran iuran anggota

Jika fitur iuran diaktifkan, sistem harus mendukung:
- Pengaturan jenis iuran.
- Periode pembayaran.
- Penetapan iuran kepada anggota.
- Pencatatan pembayaran.
- Status pembayaran.
- Riwayat pembayaran.
- Rekap tunggakan.
- Filter anggota dan periode.

Jangan menganggap setiap iuran harus mempunyai nominal yang sama jika aturan organisasi belum ditentukan.

Jangan otomatis mengirim pesan penagihan eksternal tanpa integrasi yang memang dikonfigurasi.

#### F. Perhitungan saldo

Saldo dihitung dari saldo awal yang terkonfigurasi dan transaksi yang tercatat.

Rumus dasar:

Saldo akhir = Saldo awal + Total pemasukan - Total pengeluaran.

Jangan menghitung transaksi yang batal atau tidak valid sebagai transaksi aktif.

Gunakan transaksi database ketika satu operasi melibatkan beberapa perubahan data yang harus berhasil atau gagal secara bersamaan.

#### G. Pengamanan transaksi

- Validasi nominal.
- Tolak nilai tidak valid.
- Batasi akses sesuai role.
- Simpan riwayat perubahan.
- Jangan menghapus transaksi keuangan yang sudah dilaporkan tanpa prosedur yang jelas.
- Gunakan pembatalan atau reversal yang dapat diaudit jika diperlukan.
- Pastikan laporan menggunakan sumber data yang konsisten.

Jangan mengklaim bahwa laporan keuangan telah diaudit secara profesional hanya karena sistem menghasilkan rekapitulasi.

---

### 23. MODUL LAPORAN

Sediakan laporan administrasi dan keuangan.

#### Laporan administrasi
- Data anggota.
- Data anggota per regu.
- Data pembina.
- Rekap absensi.
- Rekap kegiatan.
- Rekap SKU/SKK jika digunakan.
- Rekap surat jika digunakan.
- Rekap publikasi jika diperlukan.

#### Laporan keuangan
- Pemasukan.
- Pengeluaran.
- Saldo.
- Transaksi berdasarkan kategori.
- Pembayaran iuran.
- Tunggakan iuran.
- Laporan per bulan.
- Laporan berdasarkan rentang tanggal.

Sediakan filter periode dan kategori yang relevan.

Jika ekspor PDF atau Excel diimplementasikan, pastikan:
- Isi sesuai dengan filter yang dipilih.
- Format tanggal konsisten.
- Angka menggunakan format yang mudah dibaca.
- Judul laporan jelas.
- Tidak ada data di luar hak akses pengguna.

Jangan menampilkan data keuangan kepada Sekretaris kecuali memang diberikan izin oleh Admin.

---

### 24. DASHBOARD BERDASARKAN ROLE

#### Dashboard Admin

Tampilkan ringkasan:
- Jumlah anggota aktif.
- Jumlah regu.
- Jumlah pembina.
- Kegiatan mendatang.
- Ringkasan absensi.
- Ringkasan keuangan.
- Berita terbaru.
- Artikel terbaru.
- Aktivitas administratif terbaru.

Jangan membuat angka statistik palsu.

Semua angka harus diambil dari database.

#### Dashboard Sekretaris

Tampilkan:
- Jumlah anggota.
- Jumlah regu.
- Jadwal latihan terdekat.
- Pertemuan yang belum memiliki absensi.
- Ringkasan kehadiran.
- Kegiatan terbaru.
- Dokumentasi terbaru.
- Status publikasi berita dan artikel.

#### Dashboard Bendahara

Tampilkan:
- Saldo.
- Pemasukan periode berjalan.
- Pengeluaran periode berjalan.
- Transaksi terbaru.
- Iuran yang sudah dibayar.
- Iuran yang belum dibayar jika fitur iuran diaktifkan.
- Ringkasan laporan keuangan.

Setiap dashboard harus mengambil data sesuai izin pengguna.

---

### 25. DESAIN DATABASE DAN PRISMA

Rancang schema Prisma yang konsisten dan memiliki relasi yang jelas.

Model yang perlu dipertimbangkan meliputi:

- User.
- Session atau model autentikasi yang dibutuhkan.
- OrganizationProfile atau model profil organisasi.
- Member.
- ScoutGroup.
- Leader.
- Activity.
- RecurringSchedule jika diperlukan.
- AttendanceMeeting atau model pertemuan.
- AttendanceRecord.
- SkillCategory jika diperlukan.
- SkillRequirement.
- MemberSkillProgress.
- Letter jika modul surat digunakan.
- News.
- NewsCategory.
- Article.
- ArticleCategory.
- GalleryAlbum.
- GalleryPhoto.
- FinanceCategory.
- FinancialTransaction.
- DuesType jika fitur iuran digunakan.
- MemberDues jika fitur iuran digunakan.
- Payment jika fitur iuran digunakan.
- AuditLog.
- MediaAsset atau model metadata penyimpanan file.

Model di atas merupakan rancangan awal, bukan kewajiban untuk membuat tabel yang tidak diperlukan.

Sesuaikan nama model dan relasinya dengan kebutuhan nyata.

#### Ketentuan database

1. Gunakan primary key yang konsisten.
2. Tentukan foreign key dengan benar.
3. Tambahkan unique constraint pada data yang wajib unik.
4. Tambahkan index untuk kolom yang sering digunakan dalam pencarian dan filter.
5. Tentukan strategi penghapusan data yang aman.
6. Gunakan timestamp yang sesuai.
7. Bedakan waktu pembuatan, pembaruan, dan publikasi jika dibutuhkan.
8. Gunakan tipe data nominal keuangan yang aman untuk perhitungan uang.
9. Jangan menggunakan floating point untuk nilai uang.
10. Simpan tanggal dan waktu secara konsisten.
11. Tentukan zona waktu aplikasi secara eksplisit.
12. Pertimbangkan soft delete untuk data yang perlu mempertahankan riwayat.
13. Jangan membuat relasi yang memungkinkan data historis hilang tanpa sengaja.
14. Pastikan setiap query dibatasi sesuai kebutuhan dan hak akses.

Gunakan Prisma Client melalui modul server yang terpusat.

Hindari membuat instance Prisma Client baru pada setiap permintaan.

Jangan mengimpor modul yang memiliki kredensial database ke dalam komponen client.

---

### 26. KONFIGURASI NEON

Gunakan Neon PostgreSQL sebagai database utama.

Konfigurasi harus menggunakan environment variable.

Contoh nama variabel yang dapat digunakan:

DATABASE_URL
DIRECT_URL

Gunakan DATABASE_URL untuk koneksi aplikasi sesuai konfigurasi Neon.

Jika migrasi membutuhkan koneksi langsung, gunakan DIRECT_URL sesuai kebutuhan dan dokumentasi versi Prisma yang digunakan.

Jangan mengasumsikan bahwa kedua URL harus selalu digunakan dengan cara yang sama untuk setiap versi Prisma.

Periksa konfigurasi Prisma yang sesuai dengan versi yang dipilih.

Jangan memasukkan nilai rahasia ke dalam source code.

Buat file `.env.example` tanpa kredensial nyata.

Contoh:

DATABASE_URL="your-neon-connection-string"
DIRECT_URL="your-neon-direct-connection-string"
AUTH_SECRET="replace-with-a-secure-random-secret"
IMAGE_STORAGE_PROVIDER="your-provider"
IMAGE_STORAGE_BUCKET="your-bucket"
IMAGE_STORAGE_ACCESS_KEY="your-access-key"
IMAGE_STORAGE_SECRET_KEY="your-secret-key"

Nama variabel penyimpanan gambar harus disesuaikan dengan provider yang benar-benar dipilih.

Jangan menganggap semua provider menggunakan nama variabel yang sama.

Pastikan `.env` masuk ke `.gitignore`.

Jangan menampilkan isi kredensial dalam log atau pesan error.

Jangan menghapus atau mereset database yang berisi data penting hanya untuk mengatasi masalah migrasi.

---

### 27. SEO DAN PERFORMA WEBSITE PUBLIK

Website publik harus mempunyai struktur SEO dasar yang baik.

Implementasikan:
- Metadata judul.
- Meta description.
- URL yang jelas.
- Slug berita dan artikel.
- Open Graph metadata.
- Sitemap.
- Robots.txt.
- Canonical URL jika diperlukan.
- Struktur heading yang benar.
- Alt text gambar.
- Halaman 404 yang baik.

Jangan memasukkan halaman dashboard internal ke sitemap publik.

Pastikan halaman draf tidak dapat diakses secara publik hanya dengan mengetahui slug.

Gunakan rendering yang sesuai untuk halaman publik yang sebagian besar berisi konten baca.

Hindari menjadikan seluruh website sebagai client-side rendering tanpa alasan.

Gunakan pagination untuk daftar konten yang besar.

Optimalkan ukuran gambar dan hindari pengambilan data berulang yang tidak diperlukan.

Jangan menambahkan mekanisme caching yang berpotensi membuat data sensitif tampil kepada pengguna yang salah.

---

### 28. KEAMANAN APLIKASI

Terapkan keamanan sebagai bagian dari arsitektur, bukan sebagai fitur tambahan di akhir.

Ketentuan:
- Validasi input di server.
- Validasi formulir di frontend untuk pengalaman pengguna.
- Otorisasi berdasarkan role.
- Perlindungan terhadap SQL injection melalui penggunaan Prisma secara aman.
- Sanitasi konten artikel dan berita.
- Perlindungan terhadap XSS.
- Penanganan upload file secara aman.
- Validasi MIME type dan ukuran file.
- Proteksi halaman internal.
- Pengelolaan sesi yang aman.
- Pembatasan percobaan login jika sesuai.
- Audit log untuk perubahan penting.
- Penanganan error tanpa membocorkan detail internal.
- Pengelolaan environment variable secara aman.
- Pembatasan akses terhadap file privat.

Jangan mempercayai role yang dikirim melalui formulir atau parameter URL.

Ambil identitas pengguna dan role dari sesi yang telah diverifikasi.

Untuk operasi yang sensitif, periksa ulang otorisasi di server.

Jangan menampilkan stack trace, kredensial, atau query database kepada pengguna.

---

### 29. STRUKTUR PROYEK

Gunakan satu proyek Next.js dengan struktur modular.

Contoh:

pramukaone/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── profil/
│   │   │   ├── berita/
│   │   │   ├── artikel/
│   │   │   └── galeri/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── dashboard/
│   │   │   ├── admin/
│   │   │   ├── sekretaris/
│   │   │   └── bendahara/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── public/
│   │   └── dashboard/
│   ├── features/
│   │   ├── users/
│   │   ├── members/
│   │   ├── groups/
│   │   ├── activities/
│   │   ├── attendance/
│   │   ├── skills/
│   │   ├── finance/
│   │   ├── news/
│   │   ├── articles/
│   │   ├── gallery/
│   │   └── reports/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── permissions.ts
│   │   ├── validations/
│   │   └── storage/
│   └── types/
├── .env.example
├── .gitignore
├── package.json
└── README.md

Struktur tersebut adalah pedoman, bukan alasan untuk merombak proyek yang sudah mempunyai struktur baik.

Sesuaikan implementasi dengan versi Next.js, Prisma, dan solusi autentikasi yang digunakan.

Jangan membuat semua logika dalam satu file besar.

---

### 30. PENGALAMAN PENGGUNA DAN STATUS UI

Setiap fitur harus mempunyai status antarmuka yang jelas.

Sediakan:
- Loading state.
- Empty state.
- Error state.
- Success feedback.
- Validasi formulir.
- Konfirmasi penghapusan.
- Konfirmasi tindakan penting.
- Indikator proses upload.
- Penanganan koneksi atau server yang gagal.

Contoh:

Jika belum ada anggota, tampilkan pesan bahwa data anggota belum tersedia beserta tombol Tambah Anggota jika pengguna memiliki izin.

Jika penyimpanan gagal, tampilkan pesan yang jelas dan pertahankan input pengguna sejauh memungkinkan.

Jika data sedang diproses, cegah pengiriman ganda yang tidak disengaja.

Jangan menampilkan halaman kosong atau error mentah kepada pengguna.

Jangan menampilkan tombol tindakan yang tidak dapat digunakan.

---

### 31. PENGUJIAN

Lakukan pengujian pada setiap tahap.

#### A. Pemeriksaan teknis
- TypeScript.
- ESLint.
- Build aplikasi.
- Prisma schema validation.
- Prisma Client generation.
- Migrasi database.

#### B. Pengujian autentikasi
- Login berhasil.
- Login gagal.
- Logout.
- Halaman dashboard tanpa login.
- Akses berdasarkan role.
- Akun yang dinonaktifkan.
- Operasi sensitif yang tidak diizinkan.

#### C. Pengujian administrasi
- Tambah anggota.
- Edit anggota.
- Pindah regu.
- Menonaktifkan anggota.
- Membuat kegiatan.
- Membuat berita.
- Menerbitkan artikel.
- Membuat album galeri.

#### D. Pengujian absensi
- Membuat pertemuan mingguan.
- Mencatat semua anggota.
- Mencatat berdasarkan regu.
- Mengubah status kehadiran.
- Mencegah absensi ganda.
- Mengoreksi data.
- Membuat rekap bulanan.
- Memastikan pertemuan yang dibatalkan tidak dihitung sebagai pertemuan yang dihadiri atau tidak dihadiri.

#### E. Pengujian keuangan
- Mencatat pemasukan.
- Mencatat pengeluaran.
- Memeriksa saldo.
- Mencatat pembayaran.
- Memeriksa laporan.
- Memastikan Bendahara tidak dapat mengubah pengaturan pengguna.
- Memastikan transaksi historis tetap konsisten.

#### F. Pengujian website publik
- Landing page.
- Profil.
- Daftar berita.
- Detail berita.
- Daftar artikel.
- Detail artikel.
- Galeri.
- Album.
- Halaman 404.
- Metadata SEO.

#### G. Pengujian responsif
Prioritaskan HP terlebih dahulu.

Periksa:
- Tidak ada layout yang terpotong.
- Tidak ada overflow yang tidak disengaja.
- Formulir nyaman digunakan.
- Tombol mudah disentuh.
- Tabel tetap dapat digunakan.
- Galeri tampil dengan baik.
- Navigasi berfungsi.
- Dialog tidak keluar dari viewport.

Jangan mengklaim semua pengujian berhasil jika belum dijalankan.

---

### 32. TAHAPAN PENGEMBANGAN

Jangan membangun seluruh aplikasi secara serampangan dalam satu langkah besar.

Kerjakan secara bertahap.

#### Tahap 1 — Audit dan perencanaan
- Periksa proyek.
- Identifikasi teknologi yang sudah digunakan.
- Tentukan arsitektur.
- Susun daftar fitur.
- Identifikasi dependensi dan risiko.

Jika proyek sudah berisi aplikasi, pertahankan struktur yang sehat.

#### Tahap 2 — Fondasi aplikasi
- Konfigurasi Next.js.
- TypeScript.
- Tailwind CSS.
- Komponen UI.
- Prisma.
- Neon.
- Autentikasi.
- Role dan izin.
- Layout publik.
- Layout dashboard.

#### Tahap 3 — Database dan pengguna
- Rancang schema.
- Buat migrasi.
- Siapkan seed yang aman.
- Implementasikan pengguna.
- Implementasikan hak akses.

#### Tahap 4 — Modul administrasi
- Anggota.
- Regu.
- Pembina.
- Kegiatan.
- Absensi mingguan.
- SKU/SKK jika digunakan.
- Administrasi surat jika digunakan.

#### Tahap 5 — Modul keuangan
- Kategori transaksi.
- Pemasukan.
- Pengeluaran.
- Iuran.
- Pembayaran.
- Saldo.
- Laporan.

#### Tahap 6 — Website publik
- Landing page.
- Profil.
- Berita.
- Artikel.
- Galeri.
- Halaman detail.
- SEO.

#### Tahap 7 — Integrasi media
- Penyimpanan gambar.
- Upload.
- Validasi file.
- Metadata media.
- Galeri.
- Optimasi gambar.

#### Tahap 8 — Laporan dan penyempurnaan
- Rekap administrasi.
- Rekap absensi.
- Rekap keuangan.
- Ekspor laporan.
- Audit log.
- Penyempurnaan pengalaman pengguna.

#### Tahap 9 — Pengujian dan deployment
- Jalankan pemeriksaan kode.
- Uji hak akses.
- Uji database.
- Uji alur utama.
- Uji responsif.
- Periksa environment variable.
- Siapkan deployment.
- Dokumentasikan prosedur operasional.

Jika waktu pengerjaan terbatas, prioritaskan fondasi, keamanan, administrasi anggota, absensi mingguan, dan keuangan sebelum fitur tambahan.

---

### 33. DOKUMENTASI PROYEK

Buat README.md yang menjelaskan:
- Tujuan aplikasi.
- Stack teknologi.
- Persyaratan lingkungan.
- Instalasi dependency.
- Konfigurasi environment variable.
- Cara menghubungkan Neon.
- Cara menjalankan Prisma.
- Cara menjalankan migrasi.
- Cara membuat akun Admin pertama.
- Cara menjalankan aplikasi lokal.
- Cara menjalankan pengujian.
- Cara build.
- Cara deployment.

Jangan memasukkan kredensial asli ke README.

Buat dokumentasi database dan hak akses secukupnya agar proyek mudah dilanjutkan oleh developer lain.

---

### 34. KRITERIA SELESAI

Aplikasi baru boleh dianggap memenuhi kebutuhan awal jika:

1. Website publik dapat dibuka tanpa login.
2. Landing page tampil baik di HP.
3. Berita, artikel, dan galeri dapat dikelola melalui dashboard.
4. Hanya konten yang boleh dipublikasikan yang tampil secara publik.
5. Admin, Sekretaris, dan Bendahara dapat login sesuai hak akses.
6. Anggota tidak membutuhkan akun.
7. Data anggota dan regu tersimpan di Neon.
8. Jadwal latihan mingguan dapat dikelola.
9. Absensi dapat dicatat untuk semua anggota maupun per regu.
10. Absensi ganda dicegah.
11. Rekap absensi dapat dibuat.
12. Pencatatan keuangan berfungsi.
13. Saldo dan laporan berasal dari data transaksi yang benar.
14. Foto dapat diunggah dan ditampilkan melalui sistem penyimpanan yang dipilih.
15. Prisma dan database berfungsi dengan benar.
16. Tidak ada kredensial rahasia yang tertanam di source code.
17. Hak akses dilindungi di sisi server.
18. Tidak ada fitur utama yang hanya berupa mockup.
19. Build dan pemeriksaan kode berhasil sesuai konfigurasi proyek.
20. Tampilan mobile berfungsi dengan baik.

---

### 35. INSTRUKSI EKSEKUSI UNTUK CODING AGENT

Mulai dengan memeriksa proyek yang tersedia.

Jangan langsung menulis seluruh aplikasi sebelum memahami struktur kode.

Setelah audit, kerjakan fondasi dan modul secara berurutan.

Untuk setiap tahap:
1. Jelaskan tujuan perubahan.
2. Tentukan file yang akan dibuat atau diubah.
3. Implementasikan kode.
4. Jalankan pemeriksaan yang relevan.
5. Perbaiki error yang muncul akibat perubahan.
6. Periksa bahwa fitur lain yang berkaitan tetap berfungsi.
7. Laporkan hasil secara faktual.
8. Catat pekerjaan yang belum selesai.

Jika suatu fitur membutuhkan kredensial eksternal, jangan membuat kredensial palsu. Implementasikan integrasi sesuai dokumentasi dan jelaskan environment variable yang harus disiapkan.

Jika keputusan penting belum tersedia, seperti penyedia penyimpanan gambar atau format surat organisasi, jangan mengarang konfigurasi produksi. Gunakan abstraksi atau konfigurasi yang aman dan jelaskan keputusan yang masih dibutuhkan.

**Jangan mengorbankan keamanan, konsistensi data, atau kestabilan fitur hanya untuk menyelesaikan pekerjaan lebih cepat.**

Mulailah dari audit proyek dan fondasi aplikasi PramukaOne, lalu lanjutkan secara bertahap sampai seluruh kebutuhan yang telah ditetapkan benar-benar berfungsi.