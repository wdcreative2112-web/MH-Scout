import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { Image as ImageIcon, Calendar, ArrowRight, Camera } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 sm:space-y-10">
      {/* Page Header with Glossy Badge */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
            <Camera className="w-3.5 h-3.5 text-emerald-700" />
            <span>Dokumentasi Visual</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Galeri Kegiatan Pramuka
          </h1>
          <p className="text-slate-600 text-xs sm:text-base leading-relaxed">
            Dokumentasi jejak pengembaraan, latihan lapangan, perlombaan, dan bakti karya kepramukaan MH SCOUT.
          </p>
        </div>
      </ScrollReveal>

      {albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {albums.map((album, idx) => (
            <ScrollReveal key={album.id} direction="up" delayMs={(idx % 6) * 90 + 70} className="h-full flex flex-col">
              <Link
                href={`/galeri/${album.slug}`}
                className="glossy-card rounded-2xl sm:rounded-3xl overflow-hidden group flex flex-col justify-between h-full hover:shadow-xl transition-all duration-300"
              >
                <div>
                  <div className="aspect-video bg-slate-900 relative overflow-hidden">
                    <img
                      src={album.coverImage || "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                    />
                    {/* Glossy Photo Count Badge */}
                    <span className="absolute bottom-3 right-3 bg-slate-950/75 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/15 shadow-xs flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{album._count?.photos || 0} Foto</span>
                    </span>
                  </div>
                  <div className="p-5 sm:p-6 space-y-2">
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(album.eventDate || album.createdAt)}
                    </p>
                    <h2 className="font-bold text-base sm:text-lg text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {album.title}
                    </h2>
                    {album.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{album.description}</p>
                    )}
                  </div>
                </div>
                <div className="px-5 sm:px-6 pb-5 pt-2 border-t border-slate-100 text-xs font-bold text-emerald-800 group-hover:text-emerald-600 inline-flex items-center gap-1.5">
                  <span>Buka Album</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal direction="up" delayMs={100}>
          <div className="glossy-panel text-center py-16 px-4 rounded-3xl border border-white/80">
            <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Album Foto</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Dokumentasi foto kegiatan akan dipublikasikan oleh bagian dokumentasi gugus depan.
            </p>
          </div>
        </ScrollReveal>
      )}
    </div>
  );
}
