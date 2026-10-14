"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { uploadImage } from "@/lib/storage";

export async function createAlbumAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const eventDate = formData.get("eventDate") as string;
  const isPublished = formData.get("isPublished") === "true";

  let coverImage: string | null = null;
  const file = formData.get("coverImage") as File | null;
  if (file && file.size > 0) {
    try {
      const res = await uploadImage(file);
      coverImage = res.url;
    } catch {}
  }

  let slug = slugify(title);
  const existing = await prisma.galleryAlbum.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const album = await prisma.galleryAlbum.create({
      data: {
        title,
        slug,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        coverImage,
        isPublished,
      },
    });

    revalidatePath("/dashboard/gallery");
    revalidatePath("/galeri");
    revalidatePath("/");
    return { success: true, data: album };
  } catch {
    return { success: false, error: "Gagal membuat album foto." };
  }
}

export async function addPhotoToAlbumAction(albumId: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const caption = (formData.get("caption") as string) || null;
  const file = formData.get("photo") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "File foto wajib diunggah." };
  }

  try {
    const uploadRes = await uploadImage(file);
    const photo = await prisma.galleryPhoto.create({
      data: {
        albumId,
        imageUrl: uploadRes.url,
        caption,
        isPublished: true,
      },
    });

    revalidatePath("/dashboard/gallery");
    revalidatePath("/galeri");
    return { success: true, data: photo };
  } catch (err: any) {
    return { success: false, error: err.message || "Gagal mengunggah foto." };
  }
}

export async function updateAlbumAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const existing = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Album tidak ditemukan." };
  }

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const eventDate = formData.get("eventDate") as string;
  const isPublished = formData.get("isPublished") === "true";

  let coverImage = existing.coverImage;
  const file = formData.get("coverImage") as File | null;
  if (file && file.size > 0) {
    try {
      const res = await uploadImage(file);
      coverImage = res.url;
    } catch {}
  }

  let slug = existing.slug;
  if (title && title !== existing.title) {
    slug = slugify(title);
    const slugExists = await prisma.galleryAlbum.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  try {
    const updated = await prisma.galleryAlbum.update({
      where: { id },
      data: {
        title: title || existing.title,
        slug,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        coverImage,
        isPublished,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_ALBUM",
        module: "GALERI",
        details: `Memperbarui album foto: ${updated.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/gallery");
    revalidatePath("/galeri");
    revalidatePath(`/galeri/${updated.slug}`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Gagal memperbarui album foto." };
  }
}

export async function deleteAlbumAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const existing = await prisma.galleryAlbum.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Album tidak ditemukan." };
    }

    await prisma.galleryAlbum.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_ALBUM",
        module: "GALERI",
        details: `Menghapus album foto: ${existing.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/gallery");
    revalidatePath("/galeri");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus album foto." };
  }
}

export async function deletePhotoAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const photo = await prisma.galleryPhoto.findUnique({ where: { id } });
    if (!photo) {
      return { success: false, error: "Foto tidak ditemukan." };
    }

    await prisma.galleryPhoto.delete({ where: { id } });

    revalidatePath("/dashboard/gallery");
    revalidatePath("/galeri");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus foto." };
  }
}
