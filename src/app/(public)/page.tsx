import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Compass,
  ArrowRight,
  Users,
  Award,
  Calendar,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Image as ImageIcon,
  Clock,
  MapPin,
  ChevronRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Query live data with safe fallbacks
  let profile = null;
  let recentNews: any[] = [];
  let recentArticles: any[] = [];
  let recentAlbums: any[] = [];
  let upcomingActivities: any[] = [];
  let stats = {
    membersCount: 0,
    groupsCount: 0,
    leadersCount: 0,
  };

  try {
    profile = await prisma.organizationProfile.findFirst();
    recentNews = await prisma.news.findMany({
      where: { status: "TERBIT" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { category: true },
    });
    recentArticles = await prisma.article.findMany({
      where: { status: "TERBIT" },
      orderBy: { publishedAt: "desc" },
      take: 3,
      include: { category: true },
    });
    recentAlbums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { photos: { take: 1 } },
    });
    upcomingActivities = await prisma.activity.findMany({
      where: {
        isPublic: true,
        status: { in: ["TERJADWAL", "BERJALAN"] },
      },
      orderBy: { startDate: "asc" },
      take: 2,
    });

    const [mCount, gCount, lCount] = await Promise.all([
      prisma.member.count({ where: { status: "AKTIF" } }),
      prisma.scoutGroup.count({ where: { isActive: true } }),
      prisma.leader.count({ where: { isActive: true } }),
    ]);
    stats = {
      membersCount: mCount,
      groupsCount: gCount,
      leadersCount: lCount,
    };
  } catch {
    // Database connection pending or fallback
  }

  // Fallback defaults if no data yet in DB
  const orgName = profile?.name || "Gugus Depan PramukaOne";
  const orgPangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";
  const orgDesc =
    profile?.description ||
    "Wadah pembinaan generasi muda untuk mencetak insan yang mandiri, berkarakter luhur, berdisiplin tinggi, dan senantiasa mengamalkan Tri Satya serta Dasa Darma Pramuka.";

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-scout-950 via-scout-900 to-scout-950 text-white pt-16 pb-20 sm:pt-24 sm:pb-32">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3e9b70_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-scout-800/80 border border-scout-700 text-xs sm:text-sm font-medium text-emerald-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{orgPangkalan}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none text-white">
              Pramuka Aktif, Berkarakter, dan <span className="text-emerald-400">Menginspirasi</span>.
            </h1>

            <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal">
              Selamat datang di portal resmi <strong>{orgName}</strong>. Temukan informasi kegiatan kepramukaan, berita aktual, materi kecakapan, dan dokumentasi aktivitas dalam satu sistem terintegrasi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Link
                href="/berita"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-base shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition-all active:scale-95"
              >
                <span>Warta & Kegiatan Terbaru</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-scout-800/80 hover:bg-scout-800 text-slate-100 font-semibold text-base border border-scout-700 transition-all"
              >
                <span>Profil Gugus Depan</span>
              </Link>
            </div>
          </div>

          {/* Quick Statistics Banner */}
          <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-scout-900/60 border border-scout-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.membersCount || "50+"}</p>
                  <p className="text-xs text-slate-400 font-medium">Anggota Aktif</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-scout-900/60 border border-scout-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.groupsCount || "8"}</p>
                  <p className="text-xs text-slate-400 font-medium">Regu / Sangga</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-scout-900/60 border border-scout-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{stats.leadersCount || "6"}</p>
                  <p className="text-xs text-slate-400 font-medium">Pembina Satuan</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-scout-900/60 border border-scout-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white">Mingguan</p>
                  <p className="text-xs text-slate-400 font-medium">Latihan Rutin</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION PROFIL SINGKAT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-scout-100 shadow-sm p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-scout-700 tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Pendidikan Karakter Kepanduan</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Membangun Jiwa Ksatria, Tangguh, dan Mandiri
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {orgDesc}
              </p>
              <div className="pt-2">
                <Link
                  href="/profil"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-scout-800 hover:text-emerald-600 group"
                >
                  <span>Pelajari Sejarah, Visi Misi, dan Pembina</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-gradient-to-br from-scout-50 to-emerald-50 rounded-2xl p-6 border border-scout-200/60">
              <h3 className="font-bold text-scout-900 text-base mb-3 flex items-center gap-2">
                <Compass className="w-5 h-5 text-scout-700" />
                <span>Prinsip Dasar & Kode Kehormatan</span>
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span><strong>Tri Satya:</strong> Janji setia kepada Tuhan, NKRI, mengamalkan Pancasila, dan menolong sesama hidup.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span><strong>Dasa Darma:</strong> Sepuluh pedoman moral pramuka: taqwa, cinta alam, sopan, patuh, rela menolong, rajin, hemat, disiplin, berani, suci perkataan dan perbuatan.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SECTION BERITA TERBARU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-scout-700">Warta Pangkalan</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Berita & Informasi Terkini
            </h2>
          </div>
          <Link
            href="/berita"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-scout-800 hover:text-emerald-600"
          >
            <span>Semua Berita</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentNews.map((news) => (
              <article
                key={news.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={news.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {news.category && (
                    <span className="absolute top-3 left-3 bg-scout-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                      {news.category.name}
                    </span>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <p className="text-xs text-slate-500 font-medium">{formatDate(news.publishedAt || news.createdAt)}</p>
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 group-hover:text-scout-800 transition-colors">
                      <Link href={`/berita/${news.slug}`}>{news.title}</Link>
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{news.summary}</p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <Link
                      href={`/berita/${news.slug}`}
                      className="text-xs font-bold text-scout-700 hover:text-emerald-600 inline-flex items-center gap-1"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-base">Belum Ada Warta yang Diterbitkan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Berita kegiatan terbaru akan segera dipublikasikan oleh Sekretariat Pramuka.
            </p>
          </div>
        )}
      </section>

      {/* 4. SECTION ARTIKEL PILIHAN */}
      <section className="bg-scout-50/60 border-y border-scout-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-scout-700">Edukasi Kepramukaan</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Artikel & Keterampilan Pandu
              </h2>
            </div>
            <Link
              href="/artikel"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-scout-800 hover:text-emerald-600"
            >
              <span>Semua Artikel</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentArticles.length > 0 ? (
              recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="bg-white rounded-2xl border border-scout-200/70 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-scout-700 bg-scout-100 px-2 py-0.5 rounded-md">
                      Materi Kepramukaan
                    </span>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-scout-800">
                      <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{article.summary}</p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                    <Link href={`/artikel/${article.slug}`} className="font-semibold text-scout-800 hover:text-emerald-600">
                      Pelajari &rarr;
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Default preview cards for educational content
              [
                {
                  title: "Mengenal Simpul dan Ikatan Dasar Pramuka Penggalang",
                  desc: "Panduan lengkap simpul mati, simpul hidup, simpul pangkal, dan simpul jangkar serta fungsinya dalam pioneering.",
                  slug: "simpul-dan-ikatan-dasar",
                },
                {
                  title: "Pedoman Membaca Peta Kompas dan Tanda Jejak",
                  desc: "Teknik orientasi medan, menentukan sudut azimuth-back azimuth, serta membaca jejak alam saat penjelajahan.",
                  slug: "pedoman-peta-kompas",
                },
                {
                  title: "Menjiwai Tri Satya dan Dasa Darma dalam Kehidupan Sehari-hari",
                  desc: "Refleksi mendalam pengamalan nilai-nilai kepramukaan di lingkungan keluarga, sekolah, dan masyarakat.",
                  slug: "menjiwai-tri-satya-dasa-darma",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-scout-200/70 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <span className="text-[11px] font-semibold text-scout-700 bg-scout-100 px-2 py-0.5 rounded-md">
                      Kecakapan Umum
                    </span>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-2 hover:text-scout-800">
                      <Link href="/artikel">{item.title}</Link>
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Edukasi Pandu</span>
                    <Link href="/artikel" className="font-semibold text-scout-800 hover:text-emerald-600">
                      Pelajari &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. SECTION GALERI DOKUMENTASI */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold tracking-wider uppercase text-scout-700">Rekam Jejak Aktivitas</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Galeri Dokumentasi Kegiatan
            </h2>
          </div>
          <Link
            href="/galeri"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-scout-800 hover:text-emerald-600"
          >
            <span>Semua Album Foto</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {recentAlbums.length > 0 ? (
            recentAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/galeri/${album.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all"
              >
                <img
                  src={album.coverImage || "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&auto=format&fit=crop&q=80"}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 flex flex-col justify-end text-white">
                  <p className="text-xs text-emerald-300 font-medium">{formatDate(album.eventDate || album.createdAt)}</p>
                  <h4 className="font-bold text-sm sm:text-base leading-snug line-clamp-2">{album.title}</h4>
                </div>
              </Link>
            ))
          ) : (
            // Default sample gallery cards
            [
              {
                title: "Perkemahan Sabtu Minggu (Persami)",
                date: "Dokumentasi Lapangan",
                img: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Latihan Pioneering & Pembuatan Menara Pandang",
                date: "Latihan Rutin",
                img: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Pelantikan Kenaikan Tingkat Penggalang Ramu",
                date: "Upacara Pelantikan",
                img: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=600&auto=format&fit=crop&q=80",
              },
              {
                title: "Bakti Sosial & Penanaman Pohon Penghijauan",
                date: "Aksi Pengabdian",
                img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80",
              },
            ].map((g, idx) => (
              <Link
                key={idx}
                href="/galeri"
                className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-100 border border-slate-200 shadow-xs hover:shadow-md transition-all"
              >
                <img
                  src={g.img}
                  alt={g.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 flex flex-col justify-end text-white">
                  <p className="text-xs text-emerald-300 font-medium">{g.date}</p>
                  <h4 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">{g.title}</h4>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 6. SECTION KEGIATAN PUBLIK MENDATANG */}
      {upcomingActivities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-scout-900 text-white rounded-3xl p-6 sm:p-10 border border-scout-800">
            <div className="max-w-2xl space-y-2 mb-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Agenda Terbuka</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kegiatan Pramuka Mendatang</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingActivities.map((act) => (
                <div
                  key={act.id}
                  className="bg-scout-800/80 rounded-2xl p-5 border border-scout-700/60 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded-md border border-emerald-800/50">
                      {act.category}
                    </span>
                    <h3 className="font-bold text-lg text-white">{act.title}</h3>
                    <p className="text-xs text-slate-300 line-clamp-2">{act.description}</p>
                  </div>
                  <div className="pt-4 mt-3 border-t border-scout-700/60 flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {formatDate(act.startDate)}
                    </span>
                    {act.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {act.location}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
