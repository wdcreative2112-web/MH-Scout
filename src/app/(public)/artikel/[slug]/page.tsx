import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Calendar, User, Eye, ArrowLeft, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const item = await prisma.article.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!item || item.status !== "TERBIT") {
      return { title: "Artikel Tidak Ditemukan — MH SCOUT" };
    }
    return {
      title: `${item.title} — MH SCOUT`,
      description: item.summary,
    };
  } catch {
    return { title: "Artikel Edukasi — MH SCOUT" };
  }
}

export default async function ArtikelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let item = null;
  let relatedArticles: any[] = [];

  try {
    item = await prisma.article.findUnique({
      where: { slug },
      include: { category: true, author: true },
    });

    if (item && item.status === "TERBIT") {
      await prisma.article.update({
        where: { id: item.id },
        data: { views: { increment: 1 } },
      }).catch(() => {});

      relatedArticles = await prisma.article.findMany({
        where: {
          status: "TERBIT",
          id: { not: item.id },
          categoryId: item.categoryId || undefined,
        },
        take: 3,
        orderBy: { publishedAt: "desc" },
      });
    }
  } catch {
    // DB error
  }

  if (!item || item.status !== "TERBIT") {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <Link
          href="/artikel"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-scout-800 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Materi</span>
        </Link>
      </div>

      <div className="space-y-4">
        {item.category && (
          <span className="inline-block bg-scout-100 text-scout-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {item.category.name}
          </span>
        )}
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          {item.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500 pt-2 border-y border-slate-200 py-3">
          <span className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 text-scout-700" />
            {formatDate(item.publishedAt || item.createdAt)}
          </span>
          {item.authorName && (
            <span className="flex items-center gap-1.5 font-medium">
              <User className="w-4 h-4 text-scout-700" />
              {item.authorName}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-slate-400">
            <Eye className="w-4 h-4" />
            {item.views + 1} kali dibaca
          </span>
        </div>
      </div>

      {item.coverImage && (
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm max-h-[460px] bg-slate-100">
          <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-6 rounded-2xl bg-amber-50/70 border-l-4 border-amber-600 text-slate-700 font-medium text-base sm:text-lg leading-relaxed">
        {item.summary}
      </div>

      <div className="prose prose-slate max-w-none text-slate-800 text-base sm:text-lg leading-relaxed space-y-4 whitespace-pre-line">
        {item.content}
      </div>

      {relatedArticles.length > 0 && (
        <div className="pt-12 mt-12 border-t border-slate-200 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Materi Terkait Lainnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <Link
                key={rel.id}
                href={`/artikel/${rel.slug}`}
                className="group bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] text-slate-500">{formatDate(rel.publishedAt)}</p>
                  <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-2 group-hover:text-scout-800">
                    {rel.title}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-scout-700 mt-3 inline-flex items-center gap-1">
                  Pelajari &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
