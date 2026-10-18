"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/permissions";
import { uploadImage } from "@/lib/storage";
import {
  submitDonation,
  verifyDonation,
  rejectDonation,
  saveDonationCampaign,
  deleteDonationCampaign,
  saveDonationAccount,
  deleteDonationAccount,
} from "@/lib/donations";

/**
 * Public action: Submit a donation with optional proof receipt
 */
export async function submitDonationAction(formData: FormData) {
  try {
    const rawDonorName = (formData.get("donorName") as string) || "";
    const isAnonymous = formData.get("isAnonymous") === "true";
    const donorName = rawDonorName.trim() || (isAnonymous ? "Hamba Allah" : "Hamba Allah");
    const donorEmail = (formData.get("donorEmail") as string)?.trim() || null;
    const donorPhone = (formData.get("donorPhone") as string)?.trim() || null;
    const rawAmount = formData.get("amount") as string;
    const amount = parseFloat(rawAmount?.replace(/[^0-9]/g, "") || "0");
    const campaignId = (formData.get("campaignId") as string)?.trim() || null;
    const paymentMethod = (formData.get("paymentMethod") as string) || "TRANSFER_BANK";
    const bankName = (formData.get("bankName") as string) || "Bank Transfer";
    const message = (formData.get("message") as string)?.trim() || null;

    if (!amount || amount < 10000) {
      return {
        success: false,
        error: "Nominal donasi minimal adalah Rp 10.000.",
      };
    }

    // Optional proof upload
    let proofUrl: string | null = null;
    const proofFile = formData.get("proof") as File | null;
    if (proofFile && proofFile.size > 0) {
      try {
        const uploadRes = await uploadImage(proofFile);
        proofUrl = uploadRes.url;
      } catch (err: any) {
        console.warn("Proof upload failed:", err?.message);
      }
    }

    const donation = await submitDonation({
      campaignId,
      donorName,
      isAnonymous: isAnonymous || !rawDonorName.trim(),
      donorEmail,
      donorPhone,
      amount,
      paymentMethod,
      bankName,
      proofUrl,
      message,
    });

    try {
      revalidatePath("/donasi");
      revalidatePath("/dashboard/donations");
    } catch (e) {
      // Ignore cache revalidation warning
    }

    return {
      success: true,
      donation,
      message: "Terima kasih! Donasi Anda telah dicatat dan menunggu verifikasi bendahara.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Terjadi kesalahan saat memproses donasi.",
    };
  }
}

/**
 * Admin / Bendahara: Verifikasi donasi masuk
 */
export async function verifyDonationAction(donationId: string) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak: Hanya Admin dan Bendahara yang berwenang memverifikasi donasi." };
    }

    const res = await verifyDonation(donationId, session.id, session.name);
    if (!res.success) {
      return { success: false, error: res.error || "Gagal memverifikasi donasi." };
    }

    revalidatePath("/dashboard/donations");
    revalidatePath("/dashboard/finance");
    revalidatePath("/dashboard/reports");
    revalidatePath("/donasi");
    revalidatePath("/");

    return {
      success: true,
      donation: res.donation,
      message: "Donasi berhasil diverifikasi dan disinkronkan ke kas gugus depan.",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal memverifikasi donasi." };
  }
}

/**
 * Admin / Bendahara: Tolak donasi tidak valid
 */
export async function rejectDonationAction(donationId: string, reason: string) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak: Hanya Admin dan Bendahara yang berwenang menolak donasi." };
    }

    const res = await rejectDonation(donationId, reason, session.id);
    if (!res.success) {
      return { success: false, error: res.error || "Gagal menolak donasi." };
    }

    revalidatePath("/dashboard/donations");
    revalidatePath("/donasi");

    return {
      success: true,
      donation: res.donation,
      message: "Status donasi telah ditolak.",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menolak donasi." };
  }
}

/**
 * Admin / Bendahara: Simpan (Create / Update) Program Kampanye Donasi
 */
export async function saveCampaignAction(formData: FormData) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak: Hanya Admin dan Bendahara yang berwenang mengelola kampanye." };
    }

    const id = (formData.get("id") as string) || undefined;
    const title = formData.get("title") as string;
    const category = (formData.get("category") as string) || "Sarana & Prasarana";
    const description = (formData.get("description") as string) || "";
    const rawTarget = formData.get("targetAmount") as string;
    const targetAmount = parseFloat(rawTarget?.replace(/[^0-9]/g, "") || "0");
    const status = (formData.get("status") as any) || "ACTIVE";
    const isFeatured = formData.get("isFeatured") === "true";
    const endDate = (formData.get("endDate") as string) || null;

    if (!title || !targetAmount) {
      return { success: false, error: "Judul kampanye dan target dana wajib diisi." };
    }

    // Cover image upload
    let coverImage = (formData.get("existingCoverImage") as string) || null;
    const coverFile = formData.get("coverImage") as File | null;
    if (coverFile && coverFile.size > 0) {
      try {
        const uploadRes = await uploadImage(coverFile);
        coverImage = uploadRes.url;
      } catch (err: any) {
        console.warn("Cover image upload failed:", err?.message);
      }
    }

    const campaign = await saveDonationCampaign({
      id,
      title,
      category,
      description,
      targetAmount,
      coverImage,
      status,
      isFeatured,
      endDate,
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/donasi");
    revalidatePath("/");

    return {
      success: true,
      campaign,
      message: id ? "Program kampanye berhasil diperbarui." : "Program kampanye baru berhasil dibuat.",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menyimpan program kampanye." };
  }
}

/**
 * Admin / Bendahara: Hapus program kampanye
 */
export async function deleteCampaignAction(id: string) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak: Hanya Admin dan Bendahara yang dapat menghapus kampanye." };
    }

    await deleteDonationCampaign(id);
    revalidatePath("/dashboard/donations");
    revalidatePath("/donasi");
    revalidatePath("/");

    return { success: true, message: "Program kampanye berhasil dihapus." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghapus program kampanye." };
  }
}

/**
 * Admin / Bendahara: Simpan Rekening / QRIS Pembayaran
 */
export async function saveAccountAction(formData: FormData) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak: Hanya Admin dan Bendahara yang berwenang mengelola rekening." };
    }

    const id = (formData.get("id") as string) || undefined;
    const bankName = (formData.get("bankName") as string)?.trim();
    let accountNumber = (formData.get("accountNumber") as string)?.trim() || "";
    const accountHolder = (formData.get("accountHolder") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const isActive = formData.has("isActiveSubmitted")
      ? formData.get("isActive") === "true" || formData.get("isActive") === "on" || formData.get("isActive") === "1"
      : formData.get("isActive") !== "false";
    const sortOrder = parseInt((formData.get("sortOrder") as string) || "1", 10);

    if (!bankName || bankName.length < 2) {
      return { success: false, error: "Nama bank / saluran pembayaran wajib diisi minimal 2 karakter." };
    }
    if (!accountHolder || accountHolder.length < 2) {
      return { success: false, error: "Nama pemilik rekening (atas nama) wajib diisi minimal 2 karakter." };
    }

    // Penanganan dan Deteksi QRIS Barcode
    let qrImageUrl: string | null = null;
    const removeRequested = formData.get("removeQrImage") === "true";
    const qrFile = formData.get("qrImage") as File | null;
    const hasQrFile = Boolean(qrFile && qrFile.size > 0 && qrFile.name);
    const existing = (formData.get("existingQrImageUrl") as string)?.trim() || null;
    const hasExistingQr = Boolean(existing && !existing.includes("api.qrserver.com"));

    // Deteksi kanal apakah berupa QRIS atau Rekening Bank
    const isQrisChannel =
      bankName.toLowerCase().includes("qris") ||
      bankName.toLowerCase().includes("qr") ||
      bankName.toLowerCase().includes("barcode") ||
      accountNumber.toUpperCase() === "QRIS" ||
      !accountNumber ||
      accountNumber === "" ||
      hasQrFile ||
      (hasExistingQr && !removeRequested);

    if (isQrisChannel) {
      // Kanal QRIS tidak membutuhkan nomor rekening numerik jika dikosongkan
      if (!accountNumber || accountNumber.toUpperCase() === "QRIS") {
        accountNumber = "QRIS";
      } else {
        const cleanDigits = accountNumber.replace(/[\s-]/g, "");
        if (cleanDigits && /^\d{5,25}$/.test(cleanDigits)) {
          accountNumber = cleanDigits;
        } else {
          accountNumber = "QRIS";
        }
      }
    } else {
      // Validasi nomor rekening bank biasa: harus berupa 5-25 digit angka
      const cleanDigits = accountNumber.replace(/[\s-]/g, "");
      if (!cleanDigits || !/^\d{5,25}$/.test(cleanDigits)) {
        return {
          success: false,
          error: "Nomor rekening bank tidak valid. Harap masukkan 5 sampai 25 digit angka tanpa huruf, atau kosongkan jika ini saluran QRIS.",
        };
      }
      accountNumber = cleanDigits;
    }

    if (hasQrFile && qrFile) {
      try {
        const uploadRes = await uploadImage(qrFile);
        qrImageUrl = uploadRes.url;
      } catch (err: any) {
        return {
          success: false,
          error: `Gagal mengunggah berkas QRIS: ${err?.message || "Format atau ukuran berkas tidak didukung"}`,
        };
      }
    } else if (removeRequested) {
      qrImageUrl = null;
    } else {
      // Gunakan berkas QRIS yang sudah ada jika tidak diubah, bersihkan jika URL generator dummy
      if (hasExistingQr) {
        qrImageUrl = existing;
      } else {
        qrImageUrl = null;
      }
    }

    const account = await saveDonationAccount({
      id,
      bankName,
      accountNumber,
      accountHolder,
      description,
      qrImageUrl,
      isActive,
      sortOrder,
    });

    revalidatePath("/dashboard/donations");
    revalidatePath("/donasi");
    revalidatePath("/");

    return {
      success: true,
      account,
      message: id ? "Rekening pembayaran berhasil diperbarui." : "Rekening pembayaran baru berhasil ditambahkan.",
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menyimpan rekening pembayaran." };
  }
}

/**
 * Admin / Bendahara: Hapus rekening pembayaran
 */
export async function deleteAccountAction(id: string) {
  try {
    const session = await requireAuth();
    if (session.role !== "ADMIN" && session.role !== "BENDAHARA") {
      return { success: false, error: "Akses ditolak." };
    }

    await deleteDonationAccount(id);
    revalidatePath("/dashboard/donations");
    revalidatePath("/donasi");

    return { success: true, message: "Rekening pembayaran berhasil dihapus." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghapus rekening." };
  }
}
