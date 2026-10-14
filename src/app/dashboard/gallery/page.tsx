import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GalleryManagerView } from "./GalleryManagerView";

export const dynamic = "force-dynamic";

export default async function GalleryDashboardPage() {
  const session = await getSession();

  let albums: any[] = [];
  try {
    albums = await prisma.galleryAlbum.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        photos: true,
      },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <GalleryManagerView initialAlbums={albums} canEdit={canEdit} />
    </div>
  );
}
