"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Sparkles,
  Users,
  Target,
  CreditCard,
  QrCode,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  MessageSquare,
  Search,
  ExternalLink,
  Flame,
  HelpCircle,
  Building,
  Download,
} from "lucide-react";
import { DonationCampaign, Donation, DonationAccount } from "@/types";
import { formatRupiah, formatDate } from "@/lib/utils";
import { CopyButton } from "./CopyButton";
import { DonationModalForm } from "./DonationModalForm";
import { ScrollReveal } from "./ScrollReveal";

interface DonationClientViewProps {
  campaigns: DonationCampaign[];
  accounts: DonationAccount[];
  recentDonations: Donation[];
  stats: {
    totalCollected: number;
    pendingCount: number;
    totalDonors: number;
    activeCampaignsCount: number;
  };
}

export function DonationClientView({
  campaigns,
  accounts,
  recentDonations,
  stats,
}: DonationClientViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [zoomQrAccount, setZoomQrAccount] = useState<DonationAccount | null>(null);

  const categories = [
    { id: "ALL", label: "Semua Program" },
    { id: "Sarana & Prasarana", label: "Sarana & Prasarana" },
    { id: "Beasiswa & Pembinaan", label: "Beasiswa & Pembinaan" },
    { id: "Sosial & Bencana", label: "Sosial & Pengabdian" },
  ];

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesCat =
      selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleOpenDonate = (campaignId?: string | null) => {
    setSelectedCampaignId(campaignId || null);
    setIsModalOpen(true);
  };

  const qrisAccount =
    accounts.find((a) => a.bankName.toLowerCase().includes("qris") && a.qrImageUrl) ||
    accounts.find((a) => a.qrImageUrl);

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. HERO SECTION WITH GLOSSY DARK BACKDROP & STATS */}
      <section className="relative overflow-hidden pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-7xl mx-auto rounded-3xl lg:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071912] border border-emerald-500/20 shadow-[0_25px_50px_-12px_rgba(9,34,24,0.5)] p-5 sm:p-12 lg:p-16">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none animate-float-slow" />
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />

          <ScrollReveal direction="up" delayMs={50}>
            <div className="relative z-10 max-w-3xl space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md text-[11px] sm:text-sm font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 shrink-0" />
                <span>Gerakan Kebaikan & Infak Pramuka</span>
              </div>

              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.2] sm:leading-[1.1] text-white">
                Dukung Kemandirian & Pembinaan{" "}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                  Pramuka Masa Depan
                </span>
                .
              </h1>

              <p className="text-xs sm:text-base lg:text-lg text-slate-300 leading-relaxed max-w-2xl">
                Setiap rupiah yang Anda salurkan menjadi bekal pembinaan karakter, perlengkapan latihan kepanduan, dan beasiswa adik-adik penggalang dan penegak pangkalan MH SCOUT.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenDonate(null)}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-white font-bold text-xs sm:text-sm glossy-button-primary shimmer-sweep active:scale-95 transition-all group shadow-md"
                >
                  <Heart className="w-4 h-4 text-rose-300 fill-rose-300 group-hover:scale-110 transition-transform shrink-0" />
                  <span>Salurkan Donasi Sekarang</span>
                  <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
                <a
                  href="#rekening-resmi"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 sm:px-6 sm:py-3.5 rounded-2xl text-white font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md shadow-xs active:scale-95 transition-all"
                >
                  <CreditCard className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>Lihat Rekening Resmi & QRIS</span>
                </a>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Stats Grid - Mobile Optimized (No Cutoffs or Ellipsis) */}
          <div className="relative z-10 mt-8 sm:mt-14 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <ScrollReveal direction="up" delayMs={100} className="h-full">
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 shrink-0">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-500/30">
                    Terkumpul
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-xl lg:text-2xl font-black text-white leading-tight break-words">
                    {formatRupiah(stats.totalCollected)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">
                    Total Dana Dihimpun
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={160} className="h-full">
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-500/30">
                    Donatur
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-xl lg:text-2xl font-black text-white leading-tight break-words">
                    {stats.totalDonors}+
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">
                    Orang Baik / Donatur
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={220} className="h-full">
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300 shrink-0">
                    <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-teal-300 bg-teal-950/60 px-1.5 py-0.5 rounded-md border border-teal-500/30">
                    Program
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-xl lg:text-2xl font-black text-white leading-tight break-words">
                    {stats.activeCampaignsCount} Program
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">
                    Program Aktif Berjalan
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delayMs={280} className="h-full">
              <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.07] backdrop-blur-xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.2)] h-full flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <div className="p-1.5 sm:p-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-300 shrink-0">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded-md border border-purple-500/30">
                    Audit
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-xl lg:text-2xl font-black text-white leading-tight break-words">
                    100% Terbuka
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-300 font-medium leading-tight mt-1">
                    Akuntabilitas Diaudit
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* 2. REKENING RESMI & QRIS SECTION */}
      <section id="rekening-resmi" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={70}>
          <div className="glossy-panel rounded-3xl p-6 sm:p-10 border border-white/90 shadow-[0_10px_35px_-10px_rgba(15,36,29,0.06)] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Kanal Pembayaran Terverifikasi</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                  Rekening Resmi & QRIS Nasional
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDonate(null)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white glossy-button-primary shrink-0 active:scale-95 transition-all"
              >
                <span>Konfirmasi Transfer Donasi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Bank Accounts Grid */}
              <div
                className={`${
                  qrisAccount?.qrImageUrl ? "md:col-span-8" : "md:col-span-12"
                } grid grid-cols-1 sm:grid-cols-2 gap-4`}
              >
                {accounts.map((acc) => {
                  const isQris =
                    acc.bankName.toLowerCase().includes("qris") ||
                    acc.accountNumber === "QRIS";

                  return (
                    <div
                      key={acc.id}
                      className="p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-emerald-700" />
                          <span>{acc.bankName}</span>
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Aktif
                        </span>
                      </div>

                      {isQris ? (
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                            Metode Pembayaran
                          </span>
                          <p className="text-base font-black text-emerald-950">
                            Scan & Unduh Barcode
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            a.n. <strong>{acc.accountHolder}</strong>
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            Nomor Rekening
                          </p>
                          <p className="font-mono text-base sm:text-lg font-black text-emerald-950 tracking-wider">
                            {acc.accountNumber}
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            a.n. <strong>{acc.accountHolder}</strong>
                          </p>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                          {acc.description || (isQris ? "QRIS Standar Nasional" : "Rekening donasi pangkalan")}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isQris ? (
                            acc.qrImageUrl ? (
                              <>
                                <a
                                  href={`/api/donations/download-qris?url=${encodeURIComponent(acc.qrImageUrl)}&id=${acc.id}&filename=QRIS-PRAMUKA-MH-SCOUT.png`}
                                  download="QRIS-PRAMUKA-MH-SCOUT.png"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white glossy-button-primary transition-all shadow-2xs active:scale-95 cursor-pointer"
                                  title="Unduh Barcode QRIS"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Unduh</span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setZoomQrAccount(acc)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                                  title="Perbesar Barcode"
                                >
                                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>Lihat</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200 font-semibold">
                                Barcode Disiapkan
                              </span>
                            )
                          ) : (
                            <CopyButton
                              textToCopy={acc.accountNumber.replace(/[\s-]/g, "")}
                              label="Salin"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QRIS Card Feature */}
              {qrisAccount && (
                qrisAccount.qrImageUrl ? (
                  <div className="md:col-span-4 rounded-2xl p-5 bg-gradient-to-br from-emerald-950 to-scout-900 text-white text-center border border-emerald-500/20 shadow-md space-y-3">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      <QrCode className="w-4 h-4" />
                      <span>Scan QRIS Resmi</span>
                    </div>
                    <div
                      onClick={() => setZoomQrAccount(qrisAccount)}
                      className="bg-white p-3 rounded-2xl shadow-inner cursor-pointer hover:scale-102 transition-transform inline-block group"
                      title="Klik untuk memperbesar QRIS"
                    >
                      <img
                        src={qrisAccount.qrImageUrl}
                        alt={qrisAccount.bankName}
                        className="w-40 h-40 object-contain mx-auto"
                      />
                      <span className="text-[10px] text-slate-500 font-medium group-hover:text-emerald-700 block mt-1">
                        Klik untuk memperbesar
                      </span>
                    </div>
                    
                    <div className="pt-1 flex flex-col gap-2">
                      <a
                        href={`/api/donations/download-qris?url=${encodeURIComponent(qrisAccount.qrImageUrl)}&id=${qrisAccount.id}&filename=QRIS-PRAMUKA-MH-SCOUT.png`}
                        download="QRIS-PRAMUKA-MH-SCOUT.png"
                        className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-200 shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-900" />
                        <span>Unduh Barcode QRIS</span>
                      </a>
                      <p className="text-xs text-slate-300 leading-snug">
                        Bisa di-scan langsung atau diunduh untuk bayar lewat mobile banking & e-wallet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-4 rounded-2xl p-5 bg-gradient-to-br from-slate-900 to-emerald-950 text-white text-center border border-emerald-500/20 shadow-md space-y-3">
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                      <QrCode className="w-4 h-4" />
                      <span>Kanal QRIS Pangkalan</span>
                    </div>
                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-2">
                      <p className="text-xs font-bold text-slate-200">
                        Barcode QRIS Sedang Disiapkan
                      </p>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pengurus pangkalan sedang memperbarui berkas QRIS resmi. Anda dapat menyalurkan donasi via Transfer Bank di samping.
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* 3. CAMPAIGNS PROGRAM GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <ScrollReveal direction="up" delayMs={60}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-200">
                <Target className="w-3.5 h-3.5 text-emerald-700" />
                <span>Program Pilihan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
                Program Donasi yang Sedang Berjalan
              </h2>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                placeholder="Cari program donasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-emerald-800 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 hover:bg-white border border-slate-200/80"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {filteredCampaigns.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredCampaigns.map((camp, idx) => {
              const percent = Math.min(
                100,
                Math.round((camp.collectedAmount / camp.targetAmount) * 100)
              );
              return (
                <ScrollReveal
                  key={camp.id}
                  direction="up"
                  delayMs={(idx % 6) * 100 + 80}
                  className="h-full flex flex-col"
                >
                  <article className="glossy-card rounded-3xl overflow-hidden flex flex-col justify-between h-full group hover:shadow-xl transition-all duration-300">
                    <div>
                      {/* Image Thumbnail */}
                      <div className="h-52 bg-slate-900 relative overflow-hidden">
                        <img
                          src={
                            camp.coverImage ||
                            "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=800&auto=format&fit=crop&q=80"
                          }
                          alt={camp.title}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 bg-scout-950/75 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-white/15 shadow-xs">
                          {camp.category}
                        </span>

                        {camp.status === "COMPLETED" && (
                          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs">
                            Target Terpenuhi ✓
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 space-y-3.5">
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                          <Link href={`/donasi/${camp.slug}`}>{camp.title}</Link>
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                          {camp.description}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-emerald-800 font-bold">
                              {formatRupiah(camp.collectedAmount)}
                            </span>
                            <span className="text-slate-500">{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                            <span>Target: {formatRupiah(camp.targetAmount)}</span>
                            <span>{camp.donorCount} Donatur</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      <Link
                        href={`/donasi/${camp.slug}`}
                        className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                      >
                        Detail Program
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenDonate(camp.id)}
                        className="px-4 py-2 rounded-xl text-white font-bold text-xs glossy-button-primary active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
                        <span>Beri Donasi</span>
                      </button>
                    </div>
                  </article>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <div className="glossy-panel text-center py-16 px-4 rounded-3xl border border-white/80">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Tidak Ada Program yang Sesuai</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              Coba gunakan kata kunci lain atau pilih kategori program yang berbeda.
            </p>
          </div>
        )}
      </section>

      {/* 4. WALL OF KINDNESS (FEED DONATUR TERBARU & DOA) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        <ScrollReveal direction="up" delayMs={60}>
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-200">
              <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
              <span>Doa & Jejak Kebaikan</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Donatur Terbaru & Doa Kebaikan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Untaian doa tulus dari para alumni, pembina, orang tua, dan simpatisan Gerakan Pramuka.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {recentDonations.map((don, idx) => (
            <ScrollReveal
              key={don.id}
              direction="up"
              delayMs={(idx % 6) * 80 + 70}
              className="h-full flex flex-col"
            >
              <div className="glossy-card p-5 rounded-2xl flex flex-col justify-between h-full border border-white/90 hover:shadow-md transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{don.isAnonymous ? "Hamba Allah" : don.donorName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {formatDate(don.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 italic leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                    "{don.message || "Semoga sukses selalu untuk kegiatan kepramukaan MH SCOUT."}"
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 truncate max-w-[170px]">
                    {don.campaignTitle || "Donasi Umum"}
                  </span>
                  <span className="font-bold text-emerald-800">
                    {formatRupiah(don.amount)}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* 5. TRANSPARANSI & AKUNTABILITAS PENGELOLAAN DANA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="up" delayMs={80}>
          <div className="glossy-panel-dark rounded-3xl p-6 sm:p-10 border border-emerald-500/20 text-white space-y-6">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Prinsip Akuntabilitas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Transparansi Penyaluran Dana Donasi
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Seluruh dana donasi yang masuk dicatat secara sistematis dalam pembukuan kas bendahara pangkalan dan diaudit secara berkala oleh Majelis Pembimbing Gugus Depan (Mabigus).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                <h4 className="font-bold text-sm text-white">Tercatat di Buku Kas</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Setiap donasi yang terverifikasi otomatis terintegrasi ke buku kas kasir dan laporan keuangan pangkalan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-teal-400" />
                <h4 className="font-bold text-sm text-white">Tepat Sasaran</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Penyaluran 100% diprioritaskan untuk pemenuhan sarana peserta didik dan beasiswa anggota kurang mampu.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <HelpCircle className="w-6 h-6 text-amber-300" />
                <h4 className="font-bold text-sm text-white">Layanan Konfirmasi</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Butuh tanda terima resmi atau laporan donasi khusus instansi? Hubungi Sekretariat Gugus Depan melalui WhatsApp resmi.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* QR Code Full Zoom Modal */}
      {zoomQrAccount && zoomQrAccount.qrImageUrl && (
        <div
          onClick={() => setZoomQrAccount(null)}
          className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 cursor-pointer animate-in fade-in"
        >
          <div className="min-h-full flex items-center justify-center py-4">
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center space-y-4 shadow-2xl relative my-auto cursor-default"
            >
              <button
                type="button"
                onClick={() => setZoomQrAccount(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                ✕
              </button>
              <h3 className="font-black text-slate-900 text-base">
                {zoomQrAccount.bankName}
              </h3>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block">
                <img
                  src={zoomQrAccount.qrImageUrl}
                  alt={zoomQrAccount.bankName}
                  className="w-64 h-64 object-contain mx-auto rounded-xl"
                />
              </div>
              {zoomQrAccount.accountNumber &&
                zoomQrAccount.accountNumber !== "QRIS" &&
                !zoomQrAccount.bankName.toLowerCase().includes("qris") && (
                  <p className="text-xs text-slate-500 font-mono font-bold">
                    {zoomQrAccount.accountNumber}
                  </p>
                )}
              <p className="text-xs text-slate-600">
                a.n. <strong>{zoomQrAccount.accountHolder}</strong>
              </p>
              <div className="pt-1">
                <a
                  href={`/api/donations/download-qris?url=${encodeURIComponent(zoomQrAccount.qrImageUrl)}&id=${zoomQrAccount.id}&filename=${encodeURIComponent(`${zoomQrAccount.bankName.replace(/[^a-zA-Z0-9]/g, "-")}-QRIS.png`)}`}
                  download={`${zoomQrAccount.bankName.replace(/[^a-zA-Z0-9]/g, "-")}-QRIS.png`}
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs glossy-button-primary shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Barcode QRIS</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-400">
                Mendukung aplikasi mobile banking dan seluruh dompet digital standar QRIS Nasional.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Donation Modal Form */}
      <DonationModalForm
        campaigns={campaigns}
        accounts={accounts}
        initialCampaignId={selectedCampaignId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
