import fs from "fs";
import path from "path";

// Load .env automatically if process.env.DATABASE_URL is not set
try {
  const envPath = path.resolve(process.cwd(), ".env");
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
} catch {}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding database MH SCOUT...");

  // 1. Hash Passwords
  const adminPassword = await bcrypt.hash("AdminPramuka123!", 10);
  const sekretarisPassword = await bcrypt.hash("Sekretaris123!", 10);
  const bendaharaPassword = await bcrypt.hash("Bendahara123!", 10);

  // 2. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@mhscout.id" },
    update: {},
    create: {
      name: "Kak Budi Santoso (Admin)",
      email: "admin@mhscout.id",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
      phone: "081211112222",
    },
  });

  const sekretaris = await prisma.user.upsert({
    where: { email: "sekretaris@mhscout.id" },
    update: {},
    create: {
      name: "Kak Siti Rahmawati (Sekretaris)",
      email: "sekretaris@mhscout.id",
      password: sekretarisPassword,
      role: "SEKRETARIS",
      isActive: true,
      phone: "081233334444",
    },
  });

  const bendahara = await prisma.user.upsert({
    where: { email: "bendahara@mhscout.id" },
    update: {},
    create: {
      name: "Kak Hendra Wijaya (Bendahara)",
      email: "bendahara@mhscout.id",
      password: bendaharaPassword,
      role: "BENDAHARA",
      isActive: true,
      phone: "081255556666",
    },
  });

  console.log("Pengguna utama berhasil dibuat.");

  // 3. Organization Profile
  await prisma.organizationProfile.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Gugus Depan 01.001 - 01.002",
      pangkalan: "Pangkalan SMP / SMA Negeri 1",
      description:
        "Wadah pembinaan kepramukaan yang unggul, berkarakter, dan menginspirasi dalam membentuk tunas bangsa yang berakhlak mulia.",
      history:
        "Didirikan dengan semangat pengabdian kepanduan, gugus depan ini telah melahirkan puluhan Pramuka Garuda berprestasi di tingkat kwartir cabang dan daerah.",
      vision:
        "Terwujudnya anggota Gerakan Pramuka yang berkarakter tangguh, terampil, berwawasan kebangsaan, dan mandiri.",
      mission:
        "1. Menyelenggarakan latihan mingguan yang edukatif dan menantang.\n2. Mengamalkan Dasa Darma dan Tri Satya dalam kehidupan sehari-hari.\n3. Mengembangkan kecakapan umum dan khusus peserta didik.",
      address: "Jl. Pramuka No. 1, Kompleks Kampus Sekolah",
      phone: "+62 812-3456-7890",
      email: "sekretariat@mhscout.id",
      initialBalance: 2500000, // Rp 2.500.000
    },
  });

  // 4. Leaders (Pembina)
  const leader1 = await prisma.leader.upsert({
    where: { id: "leader-1" },
    update: {},
    create: {
      id: "leader-1",
      name: "Kak Budi Santoso, S.Pd",
      nip: "01.001.001",
      gender: "L",
      position: "Ketua Gugus Depan (Ka Gudep)",
      phone: "081211112222",
      email: "budi@mhscout.id",
    },
  });

  const leader2 = await prisma.leader.upsert({
    where: { id: "leader-2" },
    update: {},
    create: {
      id: "leader-2",
      name: "Kak Siti Rahmawati, S.Pd",
      nip: "01.002.001",
      gender: "P",
      position: "Pembina Satuan Putri",
      phone: "081233334444",
      email: "siti@mhscout.id",
    },
  });

  const leader3 = await prisma.leader.upsert({
    where: { id: "leader-3" },
    update: {},
    create: {
      id: "leader-3",
      name: "Kak Hendra Wijaya",
      nip: "01.001.002",
      gender: "L",
      position: "Pembina Satuan Putra",
      phone: "081255556666",
      email: "hendra@mhscout.id",
    },
  });

  // 5. Scout Groups (Regu)
  const groupRajawali = await prisma.scoutGroup.upsert({
    where: { id: "group-rajawali" },
    update: {},
    create: {
      id: "group-rajawali",
      name: "Regu Rajawali",
      category: "Penggalang Putra",
      leaderId: leader3.id,
      description: "Regu penggalang putra berprestasi pionering dan navigasi",
    },
  });

  const groupMelati = await prisma.scoutGroup.upsert({
    where: { id: "group-melati" },
    update: {},
    create: {
      id: "group-melati",
      name: "Regu Melati",
      category: "Penggalang Putri",
      leaderId: leader2.id,
      description: "Regu penggalang putri berprestasi semapur dan morse",
    },
  });

  const groupElang = await prisma.scoutGroup.upsert({
    where: { id: "group-elang" },
    update: {},
    create: {
      id: "group-elang",
      name: "Regu Elang",
      category: "Penggalang Putra",
      leaderId: leader3.id,
      description: "Regu penggalang putra pionir penjelajahan alam",
    },
  });

  // Seed demo Ketua Regu (PINRU)
  const pinruPassword = await bcrypt.hash("Pinru123!", 10);
  await prisma.user.upsert({
    where: { email: "pinru.rajawali@mhscout.id" },
    update: { groupId: groupRajawali.id },
    create: {
      name: "Ahmad Fauzi (Pinru Rajawali)",
      email: "pinru.rajawali@mhscout.id",
      password: pinruPassword,
      role: "KETUA_REGU",
      groupId: groupRajawali.id,
      isActive: true,
      phone: "081299998888",
    },
  });

  // 6. Members
  const sampleMembers = [
    { num: "PRM-001", name: "Ahmad Fauzi", g: "L", lvl: "Penggalang Terap", grp: groupRajawali.id, cls: "VIII-A" },
    { num: "PRM-002", name: "Bima Pratama", g: "L", lvl: "Penggalang Rakit", grp: groupRajawali.id, cls: "VIII-A" },
    { num: "PRM-003", name: "Candra Gunawan", g: "L", lvl: "Penggalang Ramu", grp: groupRajawali.id, cls: "VII-B" },
    { num: "PRM-004", name: "Dina Novita", g: "P", lvl: "Penggalang Terap", grp: groupMelati.id, cls: "VIII-C" },
    { num: "PRM-005", name: "Eka Safitri", g: "P", lvl: "Penggalang Rakit", grp: groupMelati.id, cls: "VIII-C" },
    { num: "PRM-006", name: "Fani Rahayu", g: "P", lvl: "Penggalang Ramu", grp: groupMelati.id, cls: "VII-A" },
    { num: "PRM-007", name: "Gilang Permana", g: "L", lvl: "Penggalang Ramu", grp: groupElang.id, cls: "VII-C" },
    { num: "PRM-008", name: "Hafiz Ridwan", g: "L", lvl: "Penggalang Rakit", grp: groupElang.id, cls: "VIII-B" },
  ];

  const createdMembers = [];
  for (const m of sampleMembers) {
    const mem = await prisma.member.upsert({
      where: { memberNumber: m.num },
      update: {},
      create: {
        memberNumber: m.num,
        fullName: m.name,
        gender: m.g,
        scoutLevel: m.lvl,
        groupId: m.grp,
        classGrade: m.cls,
        status: "AKTIF",
        phone: "081912345678",
      },
    });
    createdMembers.push(mem);
  }

  // 7. Weekly Meetings & Attendance
  const meeting1 = await prisma.attendanceMeeting.upsert({
    where: { id: "meeting-1" },
    update: {},
    create: {
      id: "meeting-1",
      title: "Latihan Rutin Minggu ke-1 (Dasar Kompas & Tali Temali)",
      meetingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      startTime: "14:00",
      endTime: "16:30",
      location: "Lapangan Utama Pangkalan",
      agenda: "Pengenalan kompas bidik, orientasi medan, dan simpul pangkal",
      status: "SELESAI",
    },
  });

  const statuses = ["HADIR", "HADIR", "HADIR", "HADIR", "IZIN", "HADIR", "HADIR", "SAKIT"];
  for (let i = 0; i < createdMembers.length; i++) {
    const mem = createdMembers[i];
    await prisma.attendanceRecord.upsert({
      where: {
        meetingId_memberId: {
          meetingId: meeting1.id,
          memberId: mem.id,
        },
      },
      update: {},
      create: {
        meetingId: meeting1.id,
        memberId: mem.id,
        status: statuses[i] as any,
        recordedById: sekretaris.id,
      },
    });
  }

  // 8. Finance Categories & Transactions
  const catIuran = await prisma.financeCategory.upsert({
    where: { id: "cat-iuran" },
    update: {},
    create: {
      id: "cat-iuran",
      name: "Iuran Wajib Anggota",
      type: "PEMASUKAN",
      description: "Kas rutin mingguan/bulanan dari anggota",
    },
  });

  const catDonasi = await prisma.financeCategory.upsert({
    where: { id: "cat-donasi" },
    update: {},
    create: {
      id: "cat-donasi",
      name: "Bantuan Dana Sekolah (BOS)",
      type: "PEMASUKAN",
      description: "Dana operasional ekstrakurikuler kepramukaan",
    },
  });

  const catPerlengkapan = await prisma.financeCategory.upsert({
    where: { id: "cat-perlengkapan" },
    update: {},
    create: {
      id: "cat-perlengkapan",
      name: "Perlengkapan & Tenda",
      type: "PENGELUARAN",
      description: "Pembelian pasak, tali pramuka, dan pemeliharaan tenda",
    },
  });

  const catKonsumsi = await prisma.financeCategory.upsert({
    where: { id: "cat-konsumsi" },
    update: {},
    create: {
      id: "cat-konsumsi",
      name: "Konsumsi Latihan & Kegiatan",
      type: "PENGELUARAN",
      description: "Snack dan air mineral saat latihan rutin",
    },
  });

  // Sample transactions
  await prisma.financialTransaction.upsert({
    where: { id: "tx-1" },
    update: {},
    create: {
      id: "tx-1",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      type: "PEMASUKAN",
      categoryId: catDonasi.id,
      amount: 1500000,
      title: "Penerimaan Dana Kegiatan Triwulan",
      sourceOrRecipient: "Bendahara Sekolah",
      description: "Subsidi kegiatan operasional pramuka",
      createdById: bendahara.id,
    },
  });

  await prisma.financialTransaction.upsert({
    where: { id: "tx-2" },
    update: {},
    create: {
      id: "tx-2",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      type: "PENGELUARAN",
      categoryId: catPerlengkapan.id,
      amount: 350000,
      title: "Pembelian Tali Marila & Pasak Tenda Baru",
      sourceOrRecipient: "Toko Perlengkapan Pramuka Jaya",
      description: "Pengadaan 10 gulung tali dan 30 pasak besi",
      createdById: bendahara.id,
    },
  });

  await prisma.financialTransaction.upsert({
    where: { id: "tx-3" },
    update: {},
    create: {
      id: "tx-3",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      type: "PENGELUARAN",
      categoryId: catKonsumsi.id,
      amount: 120000,
      title: "Konsumsi Latihan Gabungan Penggalang",
      sourceOrRecipient: "Kantin Sekolah",
      description: "Air mineral dan konsumsi adik-adik",
      createdById: bendahara.id,
    },
  });

  // 9. Dues Types & Member Dues
  const duesKas = await prisma.duesType.upsert({
    where: { id: "dues-kas-bulanan" },
    update: {},
    create: {
      id: "dues-kas-bulanan",
      name: "Iuran Kas Wajib Bulanan",
      amount: 15000,
      period: "BULANAN",
      description: "Iuran kas bulanan untuk operasional regu",
    },
  });

  for (let i = 0; i < 4; i++) {
    const mem = createdMembers[i];
    await prisma.memberDues.upsert({
      where: { id: `mdues-${mem.id}` },
      update: {},
      create: {
        id: `mdues-${mem.id}`,
        duesTypeId: duesKas.id,
        memberId: mem.id,
        periodName: "Oktober 2024",
        amount: 15000,
        amountPaid: i % 2 === 0 ? 15000 : 0,
        status: i % 2 === 0 ? "LUNAS" : "BELUM_LUNAS",
        paidAt: i % 2 === 0 ? new Date() : null,
      },
    });
  }

  // 10. SKU & SKK Requirements
  await prisma.skillRequirement.upsert({
    where: { id: "sku-ramu-1" },
    update: {},
    create: {
      id: "sku-ramu-1",
      type: "SKU",
      golongan: "Penggalang",
      level: "Ramu",
      number: 1,
      title: "Mengenal Kode Kehormatan Pramuka",
      description: "Dapat menjelaskan makna Tri Satya dan Dasa Darma serta menerapkannya dalam kehidupan sehari-hari.",
    },
  });

  await prisma.skillRequirement.upsert({
    where: { id: "sku-ramu-2" },
    update: {},
    create: {
      id: "sku-ramu-2",
      type: "SKU",
      golongan: "Penggalang",
      level: "Ramu",
      number: 2,
      title: "Teknik Tali Temali Pionering Dasar",
      description: "Dapat membuat simpul mati, simpul hidup, simpul anyam, simpul tiang, dan simpul pangkal secara tepat.",
    },
  });

  await prisma.skillRequirement.upsert({
    where: { id: "sku-ramu-3" },
    update: {},
    create: {
      id: "sku-ramu-3",
      type: "SKU",
      golongan: "Penggalang",
      level: "Ramu",
      number: 3,
      title: "Penggunaan Kompas dan Membaca Arah Mata Angin",
      description: "Dapat menentukan 8 penjuru mata angin menggunakan kompas bidik serta mengukur sudut azimuth.",
    },
  });

  // 11. News & Articles
  const catNews = await prisma.newsCategory.upsert({
    where: { slug: "kegiatan" },
    update: {},
    create: {
      name: "Kegiatan Pangkalan",
      slug: "kegiatan",
    },
  });

  await prisma.news.upsert({
    where: { slug: "sukses-gelar-gladian-pemimpin-regu-2024" },
    update: {},
    create: {
      title: "Sukses Gelar Gladian Pemimpin Regu (Dianpinru) Tahun 2024",
      slug: "sukses-gelar-gladian-pemimpin-regu-2024",
      summary:
        "Sebanyak 24 pimpinan dan wakil pimpinan regu penggalang mengikuti pembekalan kepemimpinan, tata kelola administrasi regu, dan teknik penjelajahan.",
      content:
        "Gugus Depan MH SCOUT menggelar Gladian Pemimpin Regu (Dianpinru) bertempat di lingkungan sekolah pada akhir pekan lalu. Kegiatan dibuka langsung oleh Ketua Majelis Pembimbing Gugus Depan dan dihadiri seluruh pembina satuan.\n\nDalam kegiatan ini, adik-adik pemimpin regu dibekali keterampilan manajemen regu, pembagian tugas saat perkemahan, serta simulasi pertolongan pertama (P3K). Diharapkan setiap pemimpin regu mampu membawa regunya menjadi lebih solid, disiplin, dan berprestasi.",
      status: "TERBIT",
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      coverImage: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80",
      categoryId: catNews.id,
      authorId: sekretaris.id,
      authorName: "Kak Siti Rahmawati",
    },
  });

  const catArticle = await prisma.articleCategory.upsert({
    where: { slug: "keterampilan" },
    update: {},
    create: {
      name: "Keterampilan Pandu",
      slug: "keterampilan",
    },
  });

  await prisma.article.upsert({
    where: { slug: "panduan-lengkap-tali-temali-dan-pionering" },
    update: {},
    create: {
      title: "Panduan Lengkap Simpul dan Ikatan Pionering Pramuka",
      slug: "panduan-lengkap-tali-temali-dan-pionering",
      summary:
        "Pelajari fungsi masing-masing simpul dasar serta perbedaannya dengan ikatan saat mendirikan tenda dan membuat menara pandang.",
      content:
        "Tali-temali adalah salah satu keterampilan paling esensial dalam Gerakan Pramuka. Simpul adalah hubungan antara tali dengan tali, sedangkan ikatan adalah hubungan antara tali dengan benda (seperti tongkat pramuka).\n\n1. Simpul Pangkal: Berfungsi memulai dan mengakhiri suatu ikatan pada tongkat.\n2. Simpul Mati: Digunakan untuk menyambung dua utas tali yang sama besar dan dalam keadaan kering.\n3. Ikatan Palang: Digunakan untuk menghubungkan dua tongkat yang bersilangan tegak lurus (90 derajat).\n\nKuasai simpul-simpul ini untuk mempercepat waktu pendirian bivak darurat dan konstruksi menara pengintai.",
      status: "TERBIT",
      publishedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      coverImage: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&auto=format&fit=crop&q=80",
      categoryId: catArticle.id,
      authorId: admin.id,
      authorName: "Kak Budi Santoso",
    },
  });

  // 12. Gallery Album & Photos
  const albumPersami = await prisma.galleryAlbum.upsert({
    where: { slug: "perkemahan-sabtu-minggu-pelantikan-ramu" },
    update: {},
    create: {
      title: "Perkemahan Sabtu Minggu (Persami) Pelantikan Ramu",
      slug: "perkemahan-sabtu-minggu-pelantikan-ramu",
      description:
        "Dokumentasi kemah orientasi dan pelantikan kenaikan tingkat penggalang ramu di bumi perkemahan pangkalan.",
      eventDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      isPublished: true,
      coverImage: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80",
    },
  });

  await prisma.galleryPhoto.createMany({
    data: [
      {
        albumId: albumPersami.id,
        imageUrl: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80",
        caption: "Upacara pembukaan perkemahan oleh pembina upacara",
        sortOrder: 1,
        isPublished: true,
      },
      {
        albumId: albumPersami.id,
        imageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&auto=format&fit=crop&q=80",
        caption: "Adik-adik regu mendirikan tenda komando secara gotong royong",
        sortOrder: 2,
        isPublished: true,
      },
      {
        albumId: albumPersami.id,
        imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&auto=format&fit=crop&q=80",
        caption: "Malam keakraban dan api unggun kepramukaan",
        sortOrder: 3,
        isPublished: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeding database MH SCOUT berhasil diselesaikan dengan sukses!");
}

main()
  .catch((e) => {
    console.error("Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
