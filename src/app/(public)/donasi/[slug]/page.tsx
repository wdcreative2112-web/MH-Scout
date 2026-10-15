import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getDonationCampaignBySlug,
  getDonations,
  getDonationAccounts,
  getDonationCampaigns,
} from "@/lib/donations";
import { CampaignDetailClientView } from "@/components/public/CampaignDetailClientView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getDonationCampaignBySlug(slug);

  if (!campaign) {
    return { title: "Program Donasi Tidak Ditemukan — MH SCOUT" };
  }

  return {
    title: `${campaign.title} — Donasi MH SCOUT`,
    description: campaign.description,
    openGraph: {
      title: campaign.title,
      description: campaign.description,
      images: campaign.coverImage ? [campaign.coverImage] : [],
    },
  };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campaign = await getDonationCampaignBySlug(slug);

  if (!campaign) {
    notFound();
  }

  const [donors, accounts, allCampaigns] = await Promise.all([
    getDonations({ campaignId: campaign.id, status: "VERIFIED" }),
    getDonationAccounts(),
    getDonationCampaigns(),
  ]);

  return (
    <CampaignDetailClientView
      campaign={campaign}
      accounts={accounts}
      allCampaigns={allCampaigns}
      donors={donors}
    />
  );
}
