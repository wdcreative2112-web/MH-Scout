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
    const donorName = (formData.get("donorName") as string) || "Hamba Allah";
    const isAnonymous = formData.get("isAnonymous") === "true";
    const donorEmail = (formData.get("donorEmail") as string) || null;
    const donorPhone = (formData.get("donorPhone") as string) || null;
    const rawAmount = formData.get("amount") as string;
    const amount = parseFloat(rawAmount?.replace(/[^0-9]/g, "") || "0");
    const campaignId = (formData.get("campaignId") as string) || null;
    const paymentMethod = (formData.get("paymentMethod") as string) || "TRANSFER_BANK";
    const bankName = (formData.get("bankName") as string) || "Bank Transfer";
    const message = (formData.get("message") as string) || null;

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
      isAnonymous,
      donorEmail,
      donorPhone,
      amount,
      paymentMethod,
      bankName,
      proofUrl,
      message,
    });

    revalidatePath("/donasi");
    revalidatePath("/dashboard/donations");
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
    const description = (formData.get("description") as string) || null;
    const isActive = formData.has("isActiveSubmitted")
      ? formData.get("isActive") === "true" || formData.get("isActive") === "on" || formData.get("isActive") === "1"
      : formData.get("isActive") !== "false";
    const sortOrder = parseInt((formData.get("sortOrder") as string) || "1", 10);

    if (!bankName || !accountHolder) {
      return { success: false, error: "Nama bank / saluran pembayaran dan nama pemilik rekening wajib diisi." };
    }

    // Jika nomor rekening dikosongkan (khusus kanal QRIS), tetapkan default "QRIS"
    if (!accountNumber) {
      accountNumber = "QRIS";
    }

    // Penanganan QR Image: mendukung upload file atau input tautan URL langsung
    let qrImageUrl = (formData.get("existingQrImageUrl") as string) || null;
    if (formData.get("removeQrImage") === "true") {
      qrImageUrl = null;
    }
    const directQrUrl = (formData.get("qrImageUrl") as string)?.trim();
    if (directQrUrl) {
      qrImageUrl = directQrUrl;
    }

    const qrFile = formData.get("qrImage") as File | null;
    if (qrFile && qrFile.size > 0 && qrFile.name) {
      try {
        const uploadRes = await uploadImage(qrFile);
        qrImageUrl = uploadRes.url;
      } catch (err: any) {
        console.warn("QRIS image upload failed:", err?.message);
        if (!qrImageUrl) {
          return {
            success: false,
            error: `Gagal memproses berkas QRIS: ${err?.message || "Format atau ukuran berkas tidak didukung"}`,
          };
        }
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
