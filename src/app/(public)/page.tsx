import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ScrollReveal } from "@/components/public/ScrollReveal";
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
  CheckCircle2,
  Flame,
  Heart,
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
      include: {
        photos: {
          where: { isPublished: true },
          take: 1,
        },
      },
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
  const orgName = profile?.name || "Gugus Depan MH SCOUT";
  const orgPangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";
  const orgDesc =
    profile?.description ||
    "Wadah pembinaan generasi muda untuk mencetak insan yang mandiri, berkarakter luhur, berdisiplin tinggi, dan senantiasa mengamalkan Tri Satya serta Dasa Darma Pramuka.";

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO SECTION WITH GLOSSY DARK BACKDROP & AMBIENT GLOW */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto rounded-3xl lg:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071912] border border-emerald-500/20 shadow-[0_25px_50px_-12px_rgba(9,34,24,0.5)] p-6 sm:p-12 lg:p-16">
          {/* Internal ambient glowing orbs with subtle pulse and float */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          
          {/* Subtle glossy top specular highlight */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />
          
          {/* Subtle geometric dot grid pattern */}
          <div className="absolute inset-0 opacity-[0.07] bg-[radial-gradient(#64b68f_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <ScrollReveal direction="up" delayMs={60}>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-6">
                {/* Glossy Pill Badge with Official Logo */}
                <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 backdrop-blur-md text-xs sm:text-sm font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:border-emerald-400/50 transition-colors">
                  <div className="w-5 h-5 rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                    <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
                  </div>
                  <span>{orgPangkalan}</span>
                </div>

                {/* Hero Heading */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] sm:leading-[1.1] text-white">
                  Pramuka Aktif, Berkarakter, dan{" "}
                  <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                    Menginspirasi
                  </span>
                  .
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                  Selamat datang di portal resmi <strong>{orgName}</strong>. Temukan informasi kegiatan kepramukaan, warta aktual, materi kecakapan, dan dokumentasi aktivitas dalam satu sistem terintegrasi.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-3">
                  <Link
                    href="/berita"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-white font-bold text-sm glossy-button-primary shimmer-sweep active:scale-95 transition-all group"
                  >
                    <span>Warta & Kegiatan Terbaru</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/profil"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-white font-semibold text-sm bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] shimmer-sweep active:scale-95 transition-all group"
                  >
                    <div className="w-4 h-4 rounded-full bg-white p-0.5 overflow-hidden flex items-center justify-center shrink-0">
                      <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span>Profil Gugus Depan</span>
                  </Link>
                </div>
              </div>

              {/* Right Column Official Emblem Showcase */}
              <div className="lg:col-span-4 hidden lg:flex flex-col items-center justify-center">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-amber-500/25 rounded-full blur-2xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse-glow" />
                  <div className="relative w-56 h-56 rounded-full bg-white p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,1)] border-2 border-emerald-400/40 backdrop-blur-md flex items-center justify-center transform group-hover:scale-105 transition-all duration-500">
                    <img
                      src="/logo.jpeg"
                      alt="Lambang Resmi Gugus Depan Maslahatul Hidayah"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Statistics Banner with Frosted Glass Cards - Mobile Optimized */}
          <div className="relative z-10 mt-8 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
            <ScrollReveal direction="up" delayMs={100} className="h-full">
              <div className="relative p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-white/[0.12] transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                    Anggota
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-3xl font-black text-white leading-tight break-words">{stats.membersCount || "50+"}</p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">Anggota Aktif</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={180} className="h-full">
              <div className="relative p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-white/[0.12] transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] shrink-0 group-hover:scale-110 transition-transform">
                    <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                    Satuan
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-3xl font-black text-white leading-tight break-words">{stats.groupsCount || "8"}</p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">Regu / Sangga</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={260} className="h-full">
              <div className="relative p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-white/[0.12] transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] shrink-0 group-hover:scale-110 transition-transform">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded-md border border-teal-500/30">
                    Pembina
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-base sm:text-3xl font-black text-white leading-tight break-words">{stats.leadersCount || "6"}</p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">Pembina Satuan</p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={340} className="h-full">
              <div className="relative p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.2)] hover:bg-white/[0.12] transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-500/30">
                    Agenda
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-2xl font-black text-white leading-tight break-words">Mingguan</p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">Latihan Rutin</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 2. SECTION PROFIL SINGKAT DENGAN KARTU GLOSSY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={80}>
          <div className="glossy-panel rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_12px_40px_-15px_rgba(15,36,29,0.06)] border border-white/90">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold tracking-wider uppercase">
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
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-scout-900 glossy-button-secondary shimmer-sweep group"
                  >
                    <span>Pelajari Sejarah, Visi Misi, dan Pembina</span>
                    <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 rounded-2xl p-6 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 border border-emerald-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
                <h3 className="font-bold text-scout-950 text-sm sm:text-base mb-3.5 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-700" />
                  <span>Prinsip Dasar & Kode Kehormatan</span>
                </h3>
                <ul className="space-y-3.5 text-xs sm:text-sm text-slate-700">
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/70 shadow-xs hover:bg-white transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      1
                    </span>
                    <span>
                      <strong className="text-slate-900">Tri Satya:</strong> Janji setia kepada Tuhan Yang Maha Esa, NKRI, mengamalkan Pancasila, dan menolong sesama hidup.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-slate-200/70 shadow-xs hover:bg-white transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      2
                    </span>
                    <span>
                      <strong className="text-slate-900">Dasa Darma:</strong> Sepuluh pedoman moral pramuka yang menjadi landasan berfikir, bertutur kata, dan berperilaku mulia.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. SECTION BERITA TERBARU */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <ScrollReveal direction="up" delayMs={60}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                <Flame className="w-3.5 h-3.5 text-emerald-700" />
                <span>Warta Pangkalan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                Berita & Informasi Terkini
              </h2>
            </div>
            <Link
              href="/berita"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-scout-800 hover:text-emerald-600 transition-colors group"
            >
              <span>Semua Berita</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        {recentNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentNews.map((news, idx) => (
              <ScrollReveal key={news.id} direction="up" delayMs={idx * 120 + 80} className="h-full flex flex-col">
                <article
                  className="glossy-card rounded-2xl overflow-hidden flex flex-col group justify-between h-full hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    <div className="h-48 bg-slate-100 relative overflow-hidden">
                      <img
                        src={
                          news.coverImage ||
                          "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"
                        }
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Glossy Category Pill */}
                      {news.category && (
                        <span className="absolute top-3 left-3 bg-scout-950/75 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/15 shadow-xs">
                          {news.category.name}
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2.5">
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatDate(news.publishedAt || news.createdAt)}
                      </p>
                      <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        <Link href={`/berita/${news.slug}`}>{news.title}</Link>
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {news.summary}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/berita/${news.slug}`}
                      className="text-xs font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1 group/btn"
                    >
                      <span>Baca Selengkapnya</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <ScrollReveal direction="up" delayMs={100}>
            <div className="glossy-panel text-center py-12 px-4 rounded-3xl border border-white/80">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-base">Belum Ada Warta yang Diterbitkan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Berita kegiatan terbaru akan segera dipublikasikan oleh Sekretariat Pramuka.
              </p>
            </div>
          </ScrollReveal>
        )}
      </section>

      {/* 4. SECTION ARTIKEL PILIHAN / MATERI PANDU */}
      <section className="relative py-14 overflow-hidden border-y border-emerald-900/10 bg-emerald-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ScrollReveal direction="up" delayMs={60}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Edukasi Kepramukaan</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                  Artikel & Keterampilan Pandu
                </h2>
              </div>
              <Link
                href="/artikel"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-scout-800 hover:text-emerald-600 transition-colors group"
              >
                <span>Semua Artikel</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentArticles.length > 0 ? (
              recentArticles.map((article, idx) => (
                <ScrollReveal key={article.id} direction="up" delayMs={idx * 120 + 80} className="h-full flex flex-col">
                  <div
                    className="glossy-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="space-y-3">
                      <span className="inline-block text-[10px] font-bold text-scout-900 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                        Materi Kepramukaan
                      </span>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        <Link href={`/artikel/${article.slug}`}>{article.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(article.publishedAt || article.createdAt)}</span>
                      <Link
                        href={`/artikel/${article.slug}`}
                        className="font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1 group/btn"
                      >
                        <span>Pelajari</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
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
                <ScrollReveal key={idx} direction="up" delayMs={idx * 120 + 80} className="h-full flex flex-col">
                  <div
                    className="glossy-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="space-y-3">
                      <span className="inline-block text-[10px] font-bold text-scout-900 bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                        Kecakapan Umum
                      </span>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        <Link href="/artikel">{item.title}</Link>
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Edukasi Pandu</span>
                      <Link
                        href="/artikel"
                        className="font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1 group/btn"
                      >
                        <span>Pelajari</span>
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. SECTION GALERI DOKUMENTASI KEGIATAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <ScrollReveal direction="up" delayMs={60}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Rekam Jejak Aktivitas</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                Galeri Dokumentasi Kegiatan
              </h2>
            </div>
            <Link
              href="/galeri"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-scout-800 hover:text-emerald-600 transition-colors group"
            >
              <span>Semua Album Foto</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {recentAlbums.length > 0 ? (
            recentAlbums.map((album, idx) => (
              <ScrollReveal key={album.id} direction="up" delayMs={idx * 80 + 60}>
                <Link
                  href={`/galeri/${album.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-900 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,36,29,0.06)] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
                >
                  <img
                    src={
                      album.coverImage ||
                      album.photos?.[0]?.imageUrl ||
                      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=600&auto=format&fit=crop&q=80"
                    }
                    alt={album.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  {/* Glossy gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3 sm:p-4 flex flex-col justify-end text-white">
                    <p className="text-[10px] sm:text-xs text-emerald-300 font-semibold mb-0.5">
                      {formatDate(album.eventDate || album.createdAt)}
                    </p>
                    <h4 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">
                      {album.title}
                    </h4>
                  </div>
                </Link>
              </ScrollReveal>
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
              <ScrollReveal key={idx} direction="up" delayMs={idx * 80 + 60}>
                <Link
                  href="/galeri"
                  className="group relative rounded-2xl overflow-hidden aspect-square bg-slate-900 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,36,29,0.06)] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
                >
                  <img
                    src={g.img}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-3 sm:p-4 flex flex-col justify-end text-white">
                    <p className="text-[10px] sm:text-xs text-emerald-300 font-semibold mb-0.5">{g.date}</p>
                    <h4 className="font-bold text-xs sm:text-sm leading-snug line-clamp-2">{g.title}</h4>
                  </div>
                </Link>
              </ScrollReveal>
            ))
          )}
        </div>
      </section>

      {/* 6. SECTION KEGIATAN PUBLIK MENDATANG (OPTIONAL LIVE DATA) */}
      {upcomingActivities.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={100}>
            <div className="glossy-panel-dark rounded-3xl p-6 sm:p-10 border border-emerald-500/20 text-white">
              <div className="max-w-2xl space-y-2 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Agenda Terbuka
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Kegiatan Pramuka Mendatang</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingActivities.map((act) => (
                  <div
                    key={act.id}
                    className="bg-white/[0.08] backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between hover:bg-white/[0.12] transition-colors"
                  >
                    <div className="space-y-2">
                      <span className="inline-block text-[10px] font-bold text-emerald-300 bg-emerald-950/70 px-2.5 py-1 rounded-md border border-emerald-800/50">
                        {act.category}
                      </span>
                      <h3 className="font-bold text-base sm:text-lg text-white">{act.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-2">{act.description}</p>
                    </div>
                    <div className="pt-4 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-300" />
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
          </ScrollReveal>
        </section>
      )}

      {/* 6.5. SECTION DONASI & INFOK GERAKAN KEBAIKAN */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={90}>
          <div className="relative rounded-3xl p-6 sm:p-10 lg:p-12 glossy-panel border border-white/90 shadow-[0_12px_40px_-15px_rgba(15,36,29,0.06)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200/80 text-xs font-bold tracking-wider uppercase">
                  <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                  <span>Dukungan & Donasi Pendidikan Pandu</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Wujudkan Sarana & Beasiswa Kepramukaan Bersama Kami
                </h2>
                <p className="text-slate-600 text-xs sm:text-base leading-relaxed max-w-2xl">
                  Bantu pengadaan tenda perkemahan, alat pioneering, renovasi sanggar, dan beasiswa adik-adik pramuka dhuafa. Donasi Anda 100% transparan dan diaudit berkala.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/donasi"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-white glossy-button-primary shadow-md active:scale-95 transition-all group"
                  >
                    <Heart className="w-4 h-4 text-rose-300 fill-rose-300 group-hover:scale-110 transition-transform" />
                    <span>Salurkan Donasi & Lihat Program</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/donasi#rekening-resmi"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold text-scout-900 glossy-button-secondary transition-all"
                  >
                    <span>Nomor Rekening & QRIS Resmi</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl p-6 bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-100 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Transparansi Gugus Depan</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tercatat otomatis di pembukuan kas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Menerima QRIS, BSI, BCA, & Mandiri</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Laporan realisasi kegiatan berkala</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 7. MINIMALIST CALL-TO-ACTION / SCOUT VALUES CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={100}>
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-scout-900 via-scout-800 to-emerald-900 p-8 sm:p-12 text-white border border-emerald-500/20 shadow-xl">
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs uppercase tracking-widest text-amber-300 font-bold">
                  Semangat Kepanduan
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Siap Menjadi Insan Berkarakter dan Mandiri?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bergabunglah bersama kami dalam berbagai agenda pelatihan kecakapan, kepemimpinan, dan petualangan seru kepramukaan.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <Link
                  href="/profil"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold text-scout-950 bg-white hover:bg-slate-100 shadow-md transition-all active:scale-95 shimmer-sweep group"
                >
                  <span>Pelajari Profil Kami</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
