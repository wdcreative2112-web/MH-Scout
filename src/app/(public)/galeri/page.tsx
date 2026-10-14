import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { Image as ImageIcon, Calendar, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GaleriListPage() {
  let albums: any[] = [];

  try {
    albums = await prisma.galleryAlbum.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { photos: { where: { isPublished: true } } },
        },
      },
    });
  } catch {
    // fallback
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scout-100 text-scout-800 text-xs font-bold uppercase tracking-wider">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Dokumentasi Visual</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Galeri Kegiatan Pramuka
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Dokumentasi jejak pengembaraan, latihan lapangan, perlombaan, dan bakti karya kepramukaan.
        </p>
      </div>

      {albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/galeri/${album.slug}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
            >
              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                <img
                  src={album.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-md">
                  {album._count?.photos || 0} Foto
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(album.eventDate || album.createdAt)}
                  </p>
                  <h2 className="font-bold text-lg text-slate-900 group-hover:text-scout-800 transition-colors">
                    {album.title}
                  </h2>
                  {album.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{album.description}</p>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-100 text-xs font-bold text-scout-800 group-hover:text-emerald-600 inline-flex items-center gap-1">
                  <span>Buka Album</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Belum Ada Album Foto</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Dokumentasi foto kegiatan akan dipublikasikan oleh bagian dokumentasi gugus depan.
          </p>
        </div>
      )}
    </div>
  );
}
