import { z } from "zod";

export const newsSchema = z.object({
  title: z.string().min(3, "Judul berita minimal 3 karakter"),
  summary: z.string().min(10, "Ringkasan berita minimal 10 karakter"),
  content: z.string().min(20, "Isi berita minimal 20 karakter"),
  coverImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).default("DRAF"),
  publishedAt: z.string().or(z.date()).optional().nullable(),
});

export const articleSchema = z.object({
  title: z.string().min(3, "Judul artikel minimal 3 karakter"),
  summary: z.string().min(10, "Ringkasan artikel minimal 10 karakter"),
  content: z.string().min(20, "Isi artikel minimal 20 karakter"),
  coverImage: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAF", "TERBIT", "ARSIP"]).default("DRAF"),
  publishedAt: z.string().or(z.date()).optional().nullable(),
});

export const galleryAlbumSchema = z.object({
  title: z.string().min(3, "Nama album minimal 3 karakter"),
  description: z.string().optional().nullable(),
  eventDate: z.string().or(z.date()).optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isPublished: z.boolean().default(true),
  activityId: z.string().optional().nullable(),
});

export const galleryPhotoSchema = z.object({
  albumId: z.string(),
  imageUrl: z.string().url("URL gambar tidak valid").or(z.string().min(1)),
  caption: z.string().optional().nullable(),
  sortOrder: z.coerce.number().default(0),
  isPublished: z.boolean().default(true),
});

export const letterSchema = z.object({
  letterNumber: z.string().min(1, "Nomor surat wajib diisi"),
  type: z.enum(["MASUK", "KELUAR"]),
  date: z.string().or(z.date()),
  subject: z.string().min(3, "Perihal surat minimal 3 karakter"),
  sender: z.string().optional().nullable(),
  recipient: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
  status: z.enum(["DRAF", "DIKIRIM", "DITERIMA", "DIARSIPKAN"]).default("DRAF"),
  notes: z.string().optional().nullable(),
});

export const organizationProfileSchema = z.object({
  name: z.string().min(2, "Nama organisasi minimal 2 karakter"),
  pangkalan: z.string().min(2, "Pangkalan minimal 2 karakter"),
  description: z.string().min(10, "Deskripsi minimal 10 karakter"),
  history: z.string().optional().nullable(),
  vision: z.string().optional().nullable(),
  mission: z.string().optional().nullable(),
  structure: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  instagram: z.string().optional().nullable(),
  youtube: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  heroImage: z.string().optional().nullable(),
  initialBalance: z.coerce.number().default(0),
});

export type NewsInput = z.infer<typeof newsSchema>;
export type ArticleInput = z.infer<typeof articleSchema>;
export type GalleryAlbumInput = z.infer<typeof galleryAlbumSchema>;
export type GalleryPhotoInput = z.infer<typeof galleryPhotoSchema>;
export type LetterInput = z.infer<typeof letterSchema>;
export type OrganizationProfileInput = z.infer<typeof organizationProfileSchema>;
