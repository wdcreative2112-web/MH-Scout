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

export type DonationStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type CampaignStatus = "ACTIVE" | "COMPLETED" | "PAUSED";
export type PaymentMethod = "TRANSFER_BANK" | "QRIS" | "TUNAI";

export interface DonationCampaign {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  targetAmount: number;
  collectedAmount: number;
  donorCount: number;
  startDate: string;
  endDate?: string | null;
  coverImage?: string | null;
  status: CampaignStatus;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Donation {
  id: string;
  donationNumber: string;
  campaignId?: string | null;
  campaignTitle?: string | null;
  donorName: string;
  isAnonymous: boolean;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: number;
  paymentMethod: PaymentMethod | string;
  bankName?: string | null;
  proofUrl?: string | null;
  status: DonationStatus;
  message?: string | null;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface DonationAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

