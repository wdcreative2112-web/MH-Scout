import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Newspaper, ArrowRight, Calendar, User, Search, Flame } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BeritaListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;

  let newsList: any[] = [];
  let categories: any[] = [];

  try {
    categories = await prisma.newsCategory.findMany({
      orderBy: { name: "asc" },
    });

    const where: any = {
      status: "TERBIT",
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { summary: { contains: q, mode: "insensitive" } },
      ];
    }

    if (kategori) {
      where.category = { slug: kategori };
    }

    newsList = await prisma.news.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      include: { category: true, author: true },
    });
  } catch {
    // fallback
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-10">
      {/* Page Title with Glossy Badge */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-emerald-700" />
            <span>Warta Kepramukaan</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Berita & Informasi Kegiatan
          </h1>
          <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
            Kabar terkini seputar aktivitas, prestasi, perkemahan, dan program pembinaan kepanduan MH SCOUT.
          </p>
        </div>
      </ScrollReveal>

      {/* Filter and Search Bar with Glossy Glassmorphic Panel */}
      <ScrollReveal direction="up" delayMs={90}>
        <div className="glossy-panel p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/90 shadow-[0_4px_20px_rgba(15,36,29,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Categories as Glossy Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <Link
              href="/berita"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                !kategori
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
              }`}
            >
              Semua
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/berita?kategori=${cat.slug}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  kategori === cat.slug
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Search Input with Glossy Finish */}
          <form method="GET" action="/berita" className="w-full sm:w-80 relative">
            <input
              type="text"
              name="q"
              defaultValue={q || ""}
              placeholder="Cari berita atau kegiatan..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white/90 border border-slate-200/80 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>
        </div>
      </ScrollReveal>

      {/* News Grid with Glossy Cards */}
      {newsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {newsList.map((item, idx) => (
            <ScrollReveal key={item.id} direction="up" delayMs={(idx % 6) * 90 + 70} className="h-full flex flex-col">
              <article
                className="glossy-card rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col group justify-between h-full hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="h-52 bg-slate-900 relative overflow-hidden">
                    <img
                      src={item.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {item.category && (
                      <span className="absolute top-3 left-3 bg-scout-950/75 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/15 shadow-xs">
                        {item.category.name}
                      </span>
                    )}
                  </div>
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        {formatDate(item.publishedAt || item.createdAt)}
                      </span>
                      {item.authorName && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-700" />
                          {item.authorName}
                        </span>
                      )}
                    </div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                      <Link href={`/berita/${item.slug}`}>{item.title}</Link>
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">{item.summary}</p>
                  </div>
                </div>
                <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/berita/${item.slug}`}
                    className="text-xs font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1.5 group/btn"
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
          <div className="glossy-panel text-center py-16 px-4 rounded-3xl border border-white/80">
            <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Berita Ditemukan</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Belum ada warta yang sesuai dengan pencarian atau filter yang dipilih.
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
