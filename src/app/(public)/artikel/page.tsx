import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { BookOpen, ArrowRight, Search, Calendar, User, Bookmark } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ArtikelListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  const { q, kategori } = await searchParams;

  let articles: any[] = [];
  let categories: any[] = [];

  try {
    categories = await prisma.articleCategory.findMany({
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

    articles = await prisma.article.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      include: { category: true, author: true },
    });
  } catch {
    // DB error fallback
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scout-100 text-scout-800 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Edukasi & Materi Pandu</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Artikel & Khazanah Pramuka
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Kumpulan panduan teknis kepanduan, wawasan kebangsaan, tali-temali, navigasi darat, dan pengembangan karakter generasi muda.
        </p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Link
            href="/artikel"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              !kategori ? "bg-scout-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua Materi
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/artikel?kategori=${cat.slug}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                kategori === cat.slug ? "bg-scout-800 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        <form method="GET" action="/artikel" className="w-full sm:w-72 relative">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder="Cari artikel materi..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-scout-600 focus:border-transparent"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </form>
      </div>

      {/* Articles Grid */}
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {articles.map((item) => (
            <article
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-scout-800 bg-scout-100 px-2.5 py-1 rounded-md">
                    {item.category?.name || "Materi Umum"}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(item.publishedAt || item.createdAt)}</span>
                </div>
                <h2 className="font-bold text-lg text-slate-900 group-hover:text-scout-800 line-clamp-2 transition-colors">
                  <Link href={`/artikel/${item.slug}`}>{item.title}</Link>
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">{item.summary}</p>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">{item.authorName || "Tim Pembina"}</span>
                <Link
                  href={`/artikel/${item.slug}`}
                  className="font-bold text-scout-800 hover:text-emerald-600 inline-flex items-center gap-1"
                >
                  <span>Baca Materi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
          <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Artikel Ditemukan</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Materi edukasi kepramukaan akan segera ditambahkan oleh tim pembina.
          </p>
        </div>
      )}
    </div>
  );
}
