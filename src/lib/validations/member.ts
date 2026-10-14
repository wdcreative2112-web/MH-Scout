import { z } from "zod";

export const memberSchema = z.object({
  memberNumber: z.string().min(1, "Nomor anggota wajib diisi"),
  fullName: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  gender: z.enum(["L", "P"], { required_error: "Jenis kelamin wajib dipilih" }),
  classGrade: z.string().optional().nullable(),
  scoutLevel: z.string().min(1, "Tingkatan Pramuka wajib dipilih"),
  groupId: z.string().optional().nullable(),
  joinDate: z.string().or(z.date()).optional(),
  status: z.enum(["AKTIF", "NONAKTIF", "ALUMNI"]).default("AKTIF"),
  phone: z.string().optional().nullable(),
  parentPhone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

export type MemberInput = z.infer<typeof memberSchema>;
