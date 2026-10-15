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

import { getAbsoluteImageUrl, getAbsoluteUrl } from "@/lib/share";

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

  const canonicalUrl = getAbsoluteUrl(`/donasi/${campaign.slug}`);
  const resolvedImageUrl = getAbsoluteImageUrl(campaign.coverImage);

  return {
    title: `${campaign.title} — Donasi MH SCOUT`,
    description: campaign.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      locale: "id_ID",
      url: canonicalUrl,
      siteName: "MH SCOUT — Pangkalan Gerakan Pramuka",
      title: campaign.title,
      description: campaign.description,
      images: [
        {
          url: resolvedImageUrl,
          width: 1200,
          height: 630,
          alt: campaign.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: campaign.title,
      description: campaign.description,
      images: [resolvedImageUrl],
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
