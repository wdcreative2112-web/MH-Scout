import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Newspaper, ArrowRight, Calendar, User, Search } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Page Title */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scout-100 text-scout-800 text-xs font-bold uppercase tracking-wider">
          <Newspaper className="w-3.5 h-3.5" />
          <span>Warta Kepramukaan</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Berita & Informasi Kegiatan
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Kabar terkini seputar aktivitas, prestasi, perkemahan, dan program pembinaan PramukaOne.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Link
            href="/berita"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              !kategori ? "bg-scout-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/berita?kategori=${cat.slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                kategori === cat.slug ? "bg-scout-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form method="GET" action="/berita" className="w-full sm:w-72 relative">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Cari berita..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-scout-600 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* News Grid */}
      {newsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {newsList.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              <div className="h-52 bg-slate-100 relative overflow-hidden">
                <img
                  src={item.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.category && (
                  <span className="absolute top-3 left-3 bg-scout-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                    {item.category.name}
                  </span>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-scout-700" />
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                    {item.authorName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-scout-700" />
                        {item.authorName}
                      </span>
                    )}
                  </div>
                  <h2 className="font-bold text-lg text-slate-900 line-clamp-2 group-hover:text-scout-800 transition-colors">
                    <Link href={`/berita/${item.slug}`}>{item.title}</Link>
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">{item.summary}</p>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={`/berita/${item.slug}`}
                    className="text-xs font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1.5"
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
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Tidak Ada Berita Ditemukan</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Belum ada warta yang sesuai dengan pencarian atau filter yang dipilih.
          </p>
        </div>
      )}
    </div>
  );
}
