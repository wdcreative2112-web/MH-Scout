"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ArrowLeft,
  Calendar,
  Users,
  Target,
  CheckCircle2,
  Share2,
  Clock,
  Building,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import { DonationCampaign, Donation, DonationAccount } from "@/types";
import { formatRupiah, formatDate } from "@/lib/utils";
import { DonationModalForm } from "./DonationModalForm";
import { ScrollReveal } from "./ScrollReveal";
import { CopyButton } from "./CopyButton";

interface CampaignDetailClientViewProps {
  campaign: DonationCampaign;
  accounts: DonationAccount[];
  allCampaigns: DonationCampaign[];
  donors: Donation[];
}

export function CampaignDetailClientView({
  campaign,
  accounts,
  allCampaigns,
  donors,
}: CampaignDetailClientViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const percent = Math.min(
    100,
    Math.round((campaign.collectedAmount / campaign.targetAmount) * 100)
  );

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/donasi"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs hover:bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Semua Program Donasi</span>
        </Link>
      </div>

      {/* Campaign Header & Meta */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-emerald-700" />
              <span>{campaign.category}</span>
            </span>

            {campaign.status === "COMPLETED" ? (
              <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-200 text-[11px] font-bold px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Target Donasi Terpenuhi</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold px-3 py-1 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span>Penggalangan Dana Aktif</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-snug">
            {campaign.title}
          </h1>

          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500 pt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Mulai: {formatDate(campaign.startDate)}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>{campaign.donorCount} Donatur Terlibat</span>
            </span>
          </div>
        </div>
      </ScrollReveal>

      {/* Cover Image Banner */}
      {campaign.coverImage && (
        <ScrollReveal direction="up" delayMs={80}>
          <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-[0_10px_30px_rgba(15,36,29,0.06)] aspect-video sm:aspect-[21/9] bg-slate-900">
            <img
              src={campaign.coverImage}
              alt={campaign.title}
              className="w-full h-full object-cover"
            />
          </div>
        </ScrollReveal>
      )}

      {/* Progress & Quick Donate Box */}
      <ScrollReveal direction="up" delayMs={100}>
        <div className="glossy-panel rounded-3xl p-6 sm:p-8 border border-white/90 shadow-md space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">
                  Dana Terkumpul
                </p>
                <p className="text-xl sm:text-3xl font-black text-emerald-800 break-words">
                  {formatRupiah(campaign.collectedAmount)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">
                  Target Kebutuhan
                </p>
                <p className="text-sm sm:text-lg font-bold text-slate-700 break-words">
                  {formatRupiah(campaign.targetAmount)}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="w-full h-3 rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <span className="font-bold text-emerald-700">{percent}% Tercapai</span>
              <span>{campaign.donorCount} Orang Baik</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex-1 py-3.5 px-6 rounded-2xl text-white font-bold text-xs sm:text-sm glossy-button-primary shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
              <span>Donasi Sekarang untuk Program Ini</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="py-3 px-5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>{copiedLink ? "Link Tersalin!" : "Bagikan Program"}</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Description Content */}
      <ScrollReveal direction="up" delayMs={110}>
        <div className="glossy-panel rounded-3xl p-6 sm:p-8 border border-white/90 space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>Rincian & Latar Belakang Program</span>
          </h2>
          <div className="prose prose-slate max-w-none text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
            {campaign.description}
          </div>
        </div>
      </ScrollReveal>

      {/* Donors List */}
      <ScrollReveal direction="up" delayMs={120}>
        <div className="glossy-panel rounded-3xl p-6 sm:p-8 border border-white/90 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Daftar Donatur Terverifikasi ({donors.length})</span>
            </h2>
          </div>

          {donors.length > 0 ? (
            <div className="space-y-3">
              {donors.map((don) => (
                <div
                  key={don.id}
                  className="p-4 rounded-2xl bg-white/80 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-xs sm:text-sm text-slate-900">
                      {don.isAnonymous ? "Hamba Allah" : don.donorName}
                    </p>
                    {don.message && (
                      <p className="text-xs text-slate-600 italic">
                        "{don.message}"
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400">
                      {formatDate(don.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-xs sm:text-sm text-emerald-800">
                      {formatRupiah(don.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              Jadilah orang baik pertama yang berdonasi untuk program ini!
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* Donation Modal Form */}
      <DonationModalForm
        campaigns={allCampaigns}
        accounts={accounts}
        initialCampaignId={campaign.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
