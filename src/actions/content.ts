"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { uploadImage } from "@/lib/storage";

export async function createNewsAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const status = (formData.get("status") as any) || "DRAF";
  const categoryId = (formData.get("categoryId") as string) || null;

  let coverImage: string | null = null;
  const file = formData.get("coverImage") as File | null;
  if (file && file.size > 0) {
    try {
      const res = await uploadImage(file);
      coverImage = res.url;
    } catch {}
  }

  // Generate unique slug
  let slug = slugify(title);
  const existing = await prisma.news.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const news = await prisma.news.create({
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        status,
        publishedAt: status === "TERBIT" ? new Date() : null,
        categoryId,
        authorId: session.id,
        authorName: session.name,
      },
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/berita");
    revalidatePath("/");
    return { success: true, data: news };
  } catch (err: any) {
    return { success: false, error: "Gagal membuat berita." };
  }
}

export async function updateNewsStatusAction(id: string, status: "DRAF" | "TERBIT" | "ARSIP") {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    await prisma.news.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "TERBIT" ? new Date() : undefined,
      },
    });
    revalidatePath("/dashboard/news");
    revalidatePath("/berita");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui status berita." };
  }
}

export async function createArticleAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const title = formData.get("title") as string;
  const summary = formData.get("summary") as string;
  const content = formData.get("content") as string;
  const status = (formData.get("status") as any) || "DRAF";
  const categoryId = (formData.get("categoryId") as string) || null;

  let coverImage: string | null = null;
  const file = formData.get("coverImage") as File | null;
  if (file && file.size > 0) {
    try {
      const res = await uploadImage(file);
      coverImage = res.url;
    } catch {}
  }

  let slug = slugify(title);
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Date.now()}`;
  }

  try {
    const article = await prisma.article.create({
      data: {
        title,
        slug,
        summary,
        content,
        coverImage,
        status,
        publishedAt: status === "TERBIT" ? new Date() : null,
        categoryId,
        authorId: session.id,
        authorName: session.name,
      },
    });

    revalidatePath("/dashboard/articles");
    revalidatePath("/artikel");
    revalidatePath("/");
    return { success: true, data: article };
  } catch {
    return { success: false, error: "Gagal membuat artikel." };
  }
}

export async function updateArticleStatusAction(id: string, status: "DRAF" | "TERBIT" | "ARSIP") {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    await prisma.article.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "TERBIT" ? new Date() : undefined,
      },
    });
    revalidatePath("/dashboard/articles");
    revalidatePath("/artikel");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal memperbarui status artikel." };
  }
}
