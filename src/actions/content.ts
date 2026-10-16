"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { slugify } from "@/lib/utils";
import { uploadImage } from "@/lib/storage";
import { newsSchema, articleSchema } from "@/lib/validations/content";

export async function createNewsAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    title: formData.get("title") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    status: (formData.get("status") as any) || "DRAF",
    categoryId: (formData.get("categoryId") as string) || null,
  };

  const parsed = newsSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { title, summary, content, status, categoryId } = parsed.data;

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

  const raw = {
    title: formData.get("title") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    status: (formData.get("status") as any) || "DRAF",
    categoryId: (formData.get("categoryId") as string) || null,
  };

  const parsed = articleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const { title, summary, content, status, categoryId } = parsed.data;

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

export async function updateNewsAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Berita tidak ditemukan." };
  }

  const raw = {
    title: formData.get("title") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    status: (formData.get("status") as any) || existing.status,
    categoryId: (formData.get("categoryId") as string) || null,
  };

  const parsed = newsSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const title = parsed.data.title;
  const summary = parsed.data.summary;
  const content = parsed.data.content;
  const status = parsed.data.status || existing.status;
  const categoryId = parsed.data.categoryId || null;

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
    const slugExists = await prisma.news.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  try {
    const updated = await prisma.news.update({
      where: { id },
      data: {
        title: title || existing.title,
        slug,
        summary: summary || existing.summary,
        content: content || existing.content,
        coverImage,
        status,
        publishedAt: status === "TERBIT" && !existing.publishedAt ? new Date() : existing.publishedAt,
        categoryId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_BERITA",
        module: "KONTEN",
        details: `Memperbarui warta berita: ${updated.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/news");
    revalidatePath("/berita");
    revalidatePath(`/berita/${updated.slug}`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: "Gagal memperbarui berita." };
  }
}

export async function deleteNewsAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Berita tidak ditemukan." };
    }

    await prisma.news.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_BERITA",
        module: "KONTEN",
        details: `Menghapus warta berita: ${existing.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/news");
    revalidatePath("/berita");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus berita." };
  }
}

export async function updateArticleAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const existing = await prisma.article.findUnique({ where: { id } });
  if (!existing) {
    return { success: false, error: "Artikel tidak ditemukan." };
  }

  const raw = {
    title: formData.get("title") as string,
    summary: formData.get("summary") as string,
    content: formData.get("content") as string,
    status: (formData.get("status") as any) || existing.status,
    categoryId: (formData.get("categoryId") as string) || null,
  };

  const parsed = articleSchema.partial().safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  const title = parsed.data.title;
  const summary = parsed.data.summary;
  const content = parsed.data.content;
  const status = parsed.data.status || existing.status;
  const categoryId = parsed.data.categoryId || null;

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
    const slugExists = await prisma.article.findFirst({
      where: { slug, id: { not: id } },
    });
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }
  }

  try {
    const updated = await prisma.article.update({
      where: { id },
      data: {
        title: title || existing.title,
        slug,
        summary: summary || existing.summary,
        content: content || existing.content,
        coverImage,
        status,
        publishedAt: status === "TERBIT" && !existing.publishedAt ? new Date() : existing.publishedAt,
        categoryId,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_ARTIKEL",
        module: "KONTEN",
        details: `Memperbarui artikel materi: ${updated.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/articles");
    revalidatePath("/artikel");
    revalidatePath(`/artikel/${updated.slug}`);
    revalidatePath("/");
    return { success: true, data: updated };
  } catch {
    return { success: false, error: "Gagal memperbarui artikel." };
  }
}

export async function deleteArticleAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return { success: false, error: "Artikel tidak ditemukan." };
    }

    await prisma.article.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_ARTIKEL",
        module: "KONTEN",
        details: `Menghapus artikel materi: ${existing.title}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/articles");
    revalidatePath("/artikel");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false, error: "Gagal menghapus artikel." };
  }
}
