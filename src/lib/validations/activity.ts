import { z } from "zod";

export const activitySchema = z.object({
  title: z.string().min(2, "Nama kegiatan minimal 2 karakter"),
  category: z.string().min(2, "Kategori kegiatan wajib diisi"),
  description: z.string().optional().nullable(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  location: z.string().optional().nullable(),
  status: z.enum(["TERJADWAL", "BERJALAN", "SELESAI", "DIBATALKAN"]).default("TERJADWAL"),
  isPublic: z.boolean().default(false),
  coverImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const meetingSchema = z.object({
  title: z.string().min(2, "Judul pertemuan latihan minimal 2 karakter"),
  meetingDate: z.string().or(z.date()),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().default("Pangkalan"),
  agenda: z.string().optional().nullable(),
  status: z.enum(["TERJADWAL", "SELESAI", "DIBATALKAN"]).default("SELESAI"),
  notes: z.string().optional().nullable(),
  activityId: z.string().optional().nullable(),
});

export const updateMeetingSchema = meetingSchema.partial().extend({
  id: z.string().min(1, "ID pertemuan wajib diisi"),
});

export const recurringMeetingSchema = z.object({
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  weeksCount: z.coerce.number().min(1, "Minimal 1 pertemuan").max(24, "Maksimal 24 pertemuan").default(4),
  titleTemplate: z.string().min(2, "Format judul minimal 2 karakter").default("Latihan Rutin Minggu ke-{n}"),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  location: z.string().default("Pangkalan"),
  agenda: z.string().optional().nullable(),
  status: z.enum(["TERJADWAL", "SELESAI", "DIBATALKAN"]).default("TERJADWAL"),
});

export const attendanceRecordItemSchema = z.object({
  memberId: z.string(),
  status: z.enum(["HADIR", "IZIN", "SAKIT", "ALPA"]),
  notes: z.string().optional().nullable(),
});

export const batchAttendanceSaveSchema = z.object({
  meetingId: z.string(),
  records: z.array(attendanceRecordItemSchema),
});

export type ActivityInput = z.infer<typeof activitySchema>;
export type MeetingInput = z.infer<typeof meetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type RecurringMeetingInput = z.infer<typeof recurringMeetingSchema>;
export type BatchAttendanceInput = z.infer<typeof batchAttendanceSaveSchema>;

