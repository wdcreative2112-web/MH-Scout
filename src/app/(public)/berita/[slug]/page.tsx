import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Calendar, User, Eye, ArrowLeft, Flame, ArrowRight } from "lucide-react";
import { ShareBar } from "@/components/public/ShareBar";
import { getAbsoluteImageUrl, getAbsoluteUrl } from "@/lib/share";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const item = await prisma.news.findUnique({
      where: { slug },
      include: { category: true },
    });
    if (!item || item.status !== "TERBIT") {
      return { title: "Berita Tidak Ditemukan — MH SCOUT" };
    }

    const canonicalUrl = getAbsoluteUrl(`/berita/${item.slug}`);
    const resolvedImageUrl = getAbsoluteImageUrl(item.coverImage);

    return {
      title: `${item.title} — MH SCOUT`,
      description: item.summary,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: "article",
        locale: "id_ID",
        url: canonicalUrl,
        siteName: "MH SCOUT — Pangkalan Gerakan Pramuka",
        title: item.title,
        description: item.summary,
        publishedTime: item.publishedAt?.toISOString() || item.createdAt.toISOString(),
        authors: item.authorName ? [item.authorName] : undefined,
        section: item.category?.name || "Warta Kepramukaan",
        images: [
          {
            url: resolvedImageUrl,
            width: 1200,
            height: 630,
            alt: item.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: item.title,
        description: item.summary,
        images: [resolvedImageUrl],
      },
    };
  } catch {
    return { title: "Warta Berita — MH SCOUT" };
  }
}

export default async function BeritaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let item = null;
  let relatedNews: any[] = [];

  try {
    item = await prisma.news.findUnique({
      where: { slug },
      include: { category: true, author: true },
    });

    if (item && item.status === "TERBIT") {
      // Increment views
      await prisma.news.update({
        where: { id: item.id },
        data: { views: { increment: 1 } },
      }).catch(() => {});

      // Related news
      relatedNews = await prisma.news.findMany({
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/berita"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs hover:bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Indeks Berita</span>
        </Link>
      </div>

      {/* Header */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="space-y-4">
          {item.category && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-emerald-700" />
              <span>{item.category.name}</span>
            </span>
          )}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {item.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 pt-2 border-y border-slate-200/80 py-3">
            <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-white/70 border border-slate-200/60">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              {formatDate(item.publishedAt || item.createdAt)}
            </span>
            {item.authorName && (
              <span className="inline-flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg bg-white/70 border border-slate-200/60">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                {item.authorName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-slate-400 px-2.5 py-1 rounded-lg bg-white/70 border border-slate-200/60">
              <Eye className="w-3.5 h-3.5" />
              {item.views + 1} kali dibaca
            </span>
          </div>

          {/* Quick Share to WhatsApp (Top Compact Bar) */}
          <div className="pt-1">
            <ShareBar
              variant="compact"
              title={item.title}
              summary={item.summary}
              slug={item.slug}
              type="berita"
              coverImage={item.coverImage}
              category={item.category?.name}
            />
          </div>
        </div>
      </ScrollReveal>

      {/* Cover Image */}
      {item.coverImage && (
        <ScrollReveal direction="up" delayMs={90}>
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_10px_30px_rgba(15,36,29,0.06)] max-h-[460px] bg-slate-900">
            <img
              src={item.coverImage}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
        </ScrollReveal>
      )}

      {/* Summary Highlight */}
      <ScrollReveal direction="up" delayMs={100}>
        <div className="glossy-panel p-5 sm:p-7 rounded-2xl border-l-4 border-l-emerald-600 text-slate-700 font-medium text-sm sm:text-base leading-relaxed shadow-xs">
          {item.summary}
        </div>
      </ScrollReveal>

      {/* Content */}
      <ScrollReveal direction="up" delayMs={110}>
        <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 whitespace-pre-line">
          {item.content}
        </div>
      </ScrollReveal>

      {/* Bottom Share Banner (Dedicated Call to Action) */}
      <ScrollReveal direction="up" delayMs={120}>
        <ShareBar
          variant="banner"
          title={item.title}
          summary={item.summary}
          slug={item.slug}
          type="berita"
          coverImage={item.coverImage}
          category={item.category?.name}
        />
      </ScrollReveal>

      {/* Related News */}
      {relatedNews.length > 0 && (
        <div className="pt-10 mt-10 border-t border-slate-200 space-y-5">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Warta Terkait Lainnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedNews.map((rel) => (
              <Link
                key={rel.id}
                href={`/berita/${rel.slug}`}
                className="glossy-card p-4 rounded-2xl flex flex-col justify-between group"
              >
                <div>
                  <p className="text-[11px] text-slate-500 font-medium">{formatDate(rel.publishedAt)}</p>
                  <h3 className="font-bold text-sm text-slate-900 mt-1.5 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                    {rel.title}
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-800 mt-3 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Baca</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
