import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { uploadImage } from "@/lib/storage";
import { submitDonation } from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

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
      return NextResponse.json(
        {
          success: false,
          error: "Nominal donasi minimal adalah Rp 10.000.",
        },
        { status: 400 }
      );
    }

    // Optional proof upload
    let proofUrl: string | null = null;
    const proofFile = formData.get("proof") as File | null;
    if (proofFile && proofFile.size > 0) {
      try {
        const uploadRes = await uploadImage(proofFile);
        proofUrl = uploadRes.url;
      } catch (err: any) {
        console.warn("Proof upload in submit route warning:", err?.message);
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

    return NextResponse.json({
      success: true,
      donation,
      message: "Terima kasih! Donasi Anda telah dicatat dan menunggu verifikasi bendahara.",
    });
  } catch (error: any) {
    console.error("Error in /api/donations/submit:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Terjadi kesalahan saat memproses konfirmasi donasi.",
      },
      { status: 500 }
    );
  }
}
