import React from "react";
import type { Metadata } from "next";
import {
  getDonationCampaigns,
  getDonationAccounts,
  getDonations,
  getDonationStats,
} from "@/lib/donations";
import { DonationClientView } from "@/components/public/DonationClientView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Donasi & Infak Kepanduan — MH SCOUT",
  description:
    "Salurkan infak dan donasi terbaik Anda untuk mendukung sarana prasarana perkemahan, kegiatan kepanduan, dan beasiswa adik-adik Pramuka MH SCOUT.",
  openGraph: {
    title: "Donasi & Infak Kepanduan — MH SCOUT",
    description:
      "Dukung pembinaan generasi muda berkarakter, mandiri, dan tangguh melalui donasi terpercaya pangkalan Pramuka MH SCOUT.",
  },
};

export default async function DonasiPage() {
  const [campaigns, accounts, recentDonations, stats] = await Promise.all([
    getDonationCampaigns(),
    getDonationAccounts(),
    getDonations({ status: "VERIFIED" }),
    getDonationStats(),
  ]);

  return (
    <DonationClientView
      campaigns={campaigns}
      accounts={accounts}
      recentDonations={recentDonations.slice(0, 6)}
      stats={stats}
    />
  );
}
