import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getDonations,
  getDonationCampaigns,
  getAllDonationAccountsAdmin,
  getDonationStats,
} from "@/lib/donations";
import { DonationsClientView } from "./DonationsClientView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kelola Donasi & Infaq | Pramuka MH Scout",
  description: "Manajemen program donasi, verifikasi transaksi masuk, dan pengaturan rekening bank / QRIS gugus depan.",
};

export default async function AdminDonationsPage() {
  const session = await getSession();

  // Hanya ADMIN dan BENDAHARA yang berhak mengakses dan mengelola donasi
  if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
    redirect("/dashboard");
  }

  const [donations, campaigns, accounts, stats] = await Promise.all([
    getDonations(),
    getDonationCampaigns(),
    getAllDonationAccountsAdmin(),
    getDonationStats(),
  ]);

  return (
    <DonationsClientView
      session={session}
      donations={donations}
      campaigns={campaigns}
      accounts={accounts}
      stats={stats}
    />
  );
}
