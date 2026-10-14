export type Role = "ADMIN" | "SEKRETARIS" | "BENDAHARA" | "KETUA_REGU";

export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string | null;
  groupId?: string | null;
  groupName?: string | null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type ScoutLevel =
  | "Siaga Mula"
  | "Siaga Bantu"
  | "Siaga Tata"
  | "Penggalang Ramu"
  | "Penggalang Rakit"
  | "Penggalang Terap"
  | "Penegak Bantara"
  | "Penegak Laksana"
  | "Pandega";

export type MemberStatus = "AKTIF" | "NONAKTIF" | "ALUMNI";

export type ActivityStatus = "TERJADWAL" | "BERJALAN" | "SELESAI" | "DIBATALKAN";

export type ContentStatus = "DRAF" | "TERBIT" | "ARSIP";

export type TransactionType = "PEMASUKAN" | "PENGELUARAN";
