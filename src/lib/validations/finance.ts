import { z } from "zod";

export const transactionSchema = z.object({
  referenceNo: z.string().optional().nullable(),
  date: z.string().or(z.date()),
  type: z.enum(["PEMASUKAN", "PENGELUARAN"]),
  categoryId: z.string().min(1, "Kategori transaksi wajib dipilih"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  title: z.string().min(2, "Judul transaksi minimal 2 karakter"),
  sourceOrRecipient: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  proofUrl: z.string().optional().nullable(),
});

export const financeCategorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  type: z.enum(["PEMASUKAN", "PENGELUARAN"]),
  description: z.string().optional().nullable(),
});

export const duesTypeSchema = z.object({
  name: z.string().min(2, "Nama jenis iuran minimal 2 karakter"),
  amount: z.coerce.number().positive("Nominal iuran harus lebih dari 0"),
  period: z.enum(["BULANAN", "INSIDENTAL"]).default("BULANAN"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const memberDuesPaymentSchema = z.object({
  memberDuesId: z.string(),
  amountPaid: z.coerce.number().positive("Nominal pembayaran harus lebih dari 0"),
  paidAt: z.string().or(z.date()).optional(),
  proofUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
export type FinanceCategoryInput = z.infer<typeof financeCategorySchema>;
export type DuesTypeInput = z.infer<typeof duesTypeSchema>;
export type MemberDuesPaymentInput = z.infer<typeof memberDuesPaymentSchema>;
