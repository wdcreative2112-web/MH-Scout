import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Calendar, ArrowLeft, Image as ImageIcon, Camera } from "lucide-react";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const album = await prisma.galleryAlbum.findUnique({ where: { slug } });
    if (!album || !album.isPublished) return { title: "Album Tidak Ditemukan — MH SCOUT" };
    return {
      title: `${album.title} — Galeri MH SCOUT`,
      description: album.description || "Dokumentasi kegiatan Pramuka",
    };
  } catch {
    return { title: "Galeri Foto — MH SCOUT" };
  }
}

export default async function AlbumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let album = null;

  try {
    album = await prisma.galleryAlbum.findUnique({
      where: { slug },
      include: {
        photos: {
          where: { isPublished: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
  } catch {
    // DB error
  }

  if (!album || !album.isPublished) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/galeri"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs hover:bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Semua Album</span>
        </Link>
      </div>

      {/* Header */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>{formatDate(album.eventDate || album.createdAt)}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            {album.title}
          </h1>
          {album.description && (
            <p className="text-slate-600 text-xs sm:text-base leading-relaxed">{album.description}</p>
          )}
        </div>
      </ScrollReveal>

      {/* Photo Grid with Glossy Overlays */}
      {album.photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {album.photos.map((photo, idx) => (
            <ScrollReveal key={photo.id} direction="up" delayMs={(idx % 8) * 60 + 50}>
              <div
                className="group relative rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900 border border-slate-200/80 aspect-square shadow-[0_4px_20px_rgba(15,36,29,0.06)] hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 block"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.caption || album.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                />
                {/* Glossy caption backdrop on hover or touch */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent p-4 flex items-end opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                    {photo.caption || album.title}
                  </p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal direction="up" delayMs={100}>
          <div className="glossy-panel text-center py-16 px-4 rounded-3xl border border-white/80">
            <Camera className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Foto dalam Album Ini</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Foto akan segera diunggah oleh pengelola dokumentasi pangkalan.
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
