import { z } from "zod";

export const scoutGroupSchema = z.object({
  name: z.string().min(2, "Nama regu minimal 2 karakter"),
  category: z.string().min(2, "Kategori regu wajib diisi"),
  leaderId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const leaderSchema = z.object({
  name: z.string().min(2, "Nama pembina minimal 2 karakter"),
  nip: z.string().optional().nullable(),
  gender: z.enum(["L", "P"]).optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid").optional().nullable().or(z.literal("")),
  position: z.string().min(2, "Jabatan pembina wajib diisi"),
  photo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type ScoutGroupInput = z.infer<typeof scoutGroupSchema>;
export type LeaderInput = z.infer<typeof leaderSchema>;
