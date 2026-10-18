import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  getDonations,
  getDonationCampaigns,
  getAllDonationAccountsAdmin,
  getDonationStats,
} from "@/lib/donations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 403 }
      );
    }

    const [donations, campaigns, accounts, stats] = await Promise.all([
      getDonations(),
      getDonationCampaigns(),
      getAllDonationAccountsAdmin(),
      getDonationStats(),
    ]);

    return NextResponse.json({
      success: true,
      donations,
      campaigns,
      accounts,
      stats,
    });
  } catch (error: any) {
    console.error("Error in /api/donations/list:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat data donasi." },
      { status: 500 }
    );
  }
}
