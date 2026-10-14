import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Calendar, ArrowLeft, Image as ImageIcon } from "lucide-react";
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
    if (!album || !album.isPublished) return { title: "Album Tidak Ditemukan — PramukaOne" };
    return {
      title: `${album.title} — Galeri PramukaOne`,
      description: album.description || "Dokumentasi kegiatan Pramuka",
    };
  } catch {
    return { title: "Galeri Foto — PramukaOne" };
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <Link
          href="/galeri"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-scout-800 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Album</span>
        </Link>
      </div>

      <div className="max-w-3xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(album.eventDate || album.createdAt)}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">{album.title}</h1>
        {album.description && (
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{album.description}</p>
        )}
      </div>

      {album.photos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {album.photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 aspect-square shadow-xs hover:shadow-md transition-all"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption || album.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {photo.caption && (
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-3 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Foto dalam Album Ini</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Foto akan segera diunggah oleh pengelola pangkalan.
          </p>
        </div>
      )}
    </div>
  );
}
