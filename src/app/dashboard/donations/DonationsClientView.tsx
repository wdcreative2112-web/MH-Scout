"use client";

import React, { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  CreditCard,
  Target,
  Users,
  QrCode,
  Building,
  Edit,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Upload,
  Download,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import {
  DonationCampaign,
  Donation,
  DonationAccount,
  UserSession,
} from "@/types";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  verifyDonationAction,
  rejectDonationAction,
  saveCampaignAction,
  deleteCampaignAction,
  saveAccountAction,
  deleteAccountAction,
} from "@/actions/donations";

interface DonationsClientViewProps {
  session: UserSession;
  donations: Donation[];
  campaigns: DonationCampaign[];
  accounts: DonationAccount[];
  stats: {
    totalCollected: number;
    pendingCount: number;
    pendingAmount: number;
    totalDonors: number;
    activeCampaignsCount: number;
  };
}

export function DonationsClientView({
  session,
  donations,
  campaigns,
  accounts,
  stats,
}: DonationsClientViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"donations" | "campaigns" | "accounts">("donations");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Dynamic local state with server props sync
  const [accountsList, setAccountsList] = useState<DonationAccount[]>(accounts);
  const [campaignsList, setCampaignsList] = useState<DonationCampaign[]>(campaigns);
  const [donationsList, setDonationsList] = useState<Donation[]>(donations);

  useEffect(() => {
    setAccountsList(accounts);
  }, [accounts]);

  useEffect(() => {
    setCampaignsList(campaigns);
  }, [campaigns]);

  useEffect(() => {
    setDonationsList(donations);
  }, [donations]);

  // Modals state
  const [proofModalUrl, setProofModalUrl] = useState<string | null>(null);
  const [rejectModalData, setRejectModalData] = useState<{ id: string; number: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Campaign modal
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DonationCampaign | null>(null);

  // Account modal
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DonationAccount | null>(null);
  const [accountQrPreview, setAccountQrPreview] = useState<string | null>(null);
  const [accountQrUrlInput, setAccountQrUrlInput] = useState<string>("");
  const [removeQrImage, setRemoveQrImage] = useState(false);

  // Toast / feedback message
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Filter donations
  const filteredDonations = donationsList.filter((d) => {
    const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
    const matchQuery =
      !searchQuery ||
      d.donationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.donorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.donorPhone && d.donorPhone.includes(searchQuery)) ||
      (d.campaignTitle && d.campaignTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchQuery;
  });

  // Handle Verify
  const handleVerify = (donationId: string) => {
    if (!confirm("Konfirmasi verifikasi donasi ini? Nominal akan disinkronkan ke buku kas pangkalan.")) return;
    startTransition(async () => {
      const res = await verifyDonationAction(donationId);
      if (res.success) {
        showToast("success", res.message || "Donasi berhasil diverifikasi.");
        setDonationsList((prev) =>
          prev.map((d) => (d.id === donationId ? { ...d, status: "VERIFIED" } : d))
        );
        router.refresh();
      } else {
        showToast("error", res.error || "Gagal memverifikasi donasi.");
      }
    });
  };

  // Handle Reject Submit
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalData) return;
    startTransition(async () => {
      const res = await rejectDonationAction(rejectModalData.id, rejectReason);
      if (res.success) {
        showToast("success", "Donasi telah ditolak.");
        setDonationsList((prev) =>
          prev.map((d) =>
            d.id === rejectModalData.id
              ? { ...d, status: "REJECTED", rejectionReason: rejectReason }
              : d
          )
        );
        setRejectModalData(null);
        setRejectReason("");
        router.refresh();
      } else {
        showToast("error", res.error || "Gagal menolak donasi.");
      }
    });
  };

  // Handle Delete Campaign
  const handleDeleteCampaign = (id: string, title: string) => {
    if (!confirm(`Hapus program kampanye "${title}"?`)) return;
    startTransition(async () => {
      const res = await deleteCampaignAction(id);
      if (res.success) {
        showToast("success", res.message || "Kampanye berhasil dihapus.");
        setCampaignsList((prev) => prev.filter((c) => c.id !== id));
        router.refresh();
      } else {
        showToast("error", res.error || "Gagal menghapus kampanye.");
      }
    });
  };

  // Handle Delete Account
  const handleDeleteAccount = (id: string, bankName: string) => {
    if (!confirm(`Hapus rekening "${bankName}"?`)) return;
    startTransition(async () => {
      const res = await deleteAccountAction(id);
      if (res.success) {
        showToast("success", res.message || "Rekening berhasil dihapus.");
        setAccountsList((prev) => prev.filter((a) => a.id !== id));
        router.refresh();
      } else {
        showToast("error", res.error || "Gagal menghapus rekening.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-lg transition-all animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-4 opacity-80 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Heart className="w-5 h-5 text-emerald-700" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Manajemen Donasi & Bantuan
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Kelola penerimaan donasi publik, verifikasi mutasi rekening, dan atur kampanye kepramukaan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/donasi"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all"
          >
            <span>Halaman Publik</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Terverifikasi
          </p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatRupiah(stats.totalCollected)}
          </p>
          <p className="text-[11px] text-slate-400">Masuk ke kas pangkalan</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Menunggu Verifikasi
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-600">
            {stats.pendingCount} Donasi
          </p>
          <p className="text-[11px] text-amber-700 font-medium">
            {formatRupiah(stats.pendingAmount)} belum diproses
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Total Donatur
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.totalDonors} Orang Baik
          </p>
          <p className="text-[11px] text-slate-400">Tercatat di sistem</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Program Aktif
          </p>
          <p className="text-xl sm:text-2xl font-black text-scout-900">
            {stats.activeCampaignsCount} Program
          </p>
          <p className="text-[11px] text-slate-400">Penggalangan dana dibuka</p>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 flex items-center gap-2 sm:gap-4 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("donations")}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "donations"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Donasi Masuk</span>
          {stats.pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "campaigns"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Program Kampanye ({campaigns.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === "accounts"
              ? "border-emerald-600 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Rekening & QRIS ({accounts.length})</span>
        </button>
      </div>

      {/* TAB 1: DONASI MASUK */}
      {activeTab === "donations" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "PENDING", "VERIFIED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "ALL"
                    ? "Semua Status"
                    : st === "PENDING"
                    ? "Menunggu Verifikasi"
                    : st === "VERIFIED"
                    ? "Terverifikasi"
                    : "Ditolak"}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72 relative">
              <input
                type="text"
                placeholder="Cari donatur, no donasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-3.5 px-4">No. Donasi & Tanggal</th>
                    <th className="py-3.5 px-4">Donatur</th>
                    <th className="py-3.5 px-4">Program / Alokasi</th>
                    <th className="py-3.5 px-4">Nominal & Metode</th>
                    <th className="py-3.5 px-4">Bukti Bayar</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDonations.length > 0 ? (
                    filteredDonations.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-mono font-bold text-slate-900">{d.donationNumber}</p>
                          <p className="text-[11px] text-slate-400">{formatDate(d.createdAt)}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">
                            {d.isAnonymous ? (
                              <span className="italic text-slate-500">Hamba Allah (Anonim)</span>
                            ) : (
                              d.donorName
                            )}
                          </p>
                          {d.donorPhone && (
                            <p className="text-[11px] text-slate-500">{d.donorPhone}</p>
                          )}
                          {d.message && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-1 max-w-[200px]" title={d.message}>
                              "{d.message}"
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 line-clamp-1 max-w-[180px]">
                            {d.campaignTitle || "Donasi Umum Pangkalan"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-bold text-emerald-800 text-sm">
                            {formatRupiah(d.amount)}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {d.paymentMethod === "QRIS" ? "QRIS" : d.bankName || "Transfer"}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {d.proofUrl ? (
                            <button
                              type="button"
                              onClick={() => setProofModalUrl(d.proofUrl || null)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-bold text-[11px] transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Lihat Resi</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tanpa Resi</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {d.status === "VERIFIED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Terverifikasi</span>
                            </span>
                          ) : d.status === "REJECTED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title={d.rejectionReason || "Ditolak"}>
                              <XCircle className="w-3 h-3" />
                              <span>Ditolak</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {d.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleVerify(d.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-2xs"
                                title="Verifikasi dan sinkron ke kas"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  setRejectModalData({ id: d.id, number: d.donationNumber })
                                }
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors"
                                title="Tolak donasi"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Tidak ada data donasi yang sesuai dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROGRAM KAMPANYE */}
      {activeTab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Kelola alokasi program penggalangan dana khusus untuk sarana, beasiswa, dan kegiatan.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingCampaign(null);
                setCampaignModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs glossy-button-primary shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Program Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignsList.map((camp) => {
              const percent = Math.min(
                100,
                Math.round((camp.collectedAmount / camp.targetAmount) * 100)
              );
              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {camp.category}
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mt-1">
                          {camp.title}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          camp.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : camp.status === "COMPLETED"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-emerald-700">
                          {formatRupiah(camp.collectedAmount)}
                        </span>
                        <span className="text-slate-500">{percent}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Target: {formatRupiah(camp.targetAmount)}</span>
                        <span>{camp.donorCount} Donatur</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <Link
                      href={`/donasi/${camp.slug}`}
                      target="_blank"
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1"
                    >
                      <span>Lihat Halaman</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCampaign(camp);
                          setCampaignModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        title="Edit Kampanye"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp.id, camp.title)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Kampanye"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REKENING & QRIS */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              Atur rekening bank resmi dan kode QRIS pangkalan yang ditampilkan di halaman donasi.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingAccount(null);
                setAccountQrPreview(null);
                setAccountQrUrlInput("");
                setRemoveQrImage(false);
                setAccountModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs glossy-button-primary shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Rekening Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {accountsList.map((acc) => (
              <div
                key={acc.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-emerald-700" />
                      <span>{acc.bankName}</span>
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        acc.isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {acc.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>

                  {acc.bankName.toLowerCase().includes("qris") || acc.accountNumber === "QRIS" ? (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Metode Pembayaran
                      </p>
                      <p className="font-bold text-sm text-emerald-800">
                        QRIS (Scan & Unduh Barcode)
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        a.n. <strong>{acc.accountHolder}</strong>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Nomor Rekening
                      </p>
                      <p className="font-mono text-base font-black text-slate-900 tracking-wider">
                        {acc.accountNumber}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        a.n. <strong>{acc.accountHolder}</strong>
                      </p>
                    </div>
                  )}

                  {acc.description && (
                    <p className="text-xs text-slate-500">{acc.description}</p>
                  )}

                  {acc.qrImageUrl ? (
                    <div className="pt-2 text-center space-y-2">
                      <img
                        src={acc.qrImageUrl}
                        alt="QRIS"
                        className="w-28 h-28 object-contain mx-auto rounded-lg border border-slate-200 bg-white"
                      />
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                          ✓ Berkas QRIS Terunggah
                        </span>
                        <a
                          href={acc.qrImageUrl}
                          download={`${acc.bankName.replace(/[^a-zA-Z0-9]/g, "-")}-QRIS.png`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Unduh</span>
                        </a>
                      </div>
                    </div>
                  ) : (acc.bankName.toLowerCase().includes("qris") || acc.accountNumber === "QRIS") ? (
                    <div className="pt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                      <div className="flex items-center justify-center gap-1 text-amber-900 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Barcode QRIS Belum Diunggah</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Klik tombol <strong>Edit</strong> di bawah untuk mengunggah file gambar QRIS resmi pangkalan.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount(acc);
                      const cleanQr =
                        acc.qrImageUrl && !acc.qrImageUrl.includes("api.qrserver.com")
                          ? acc.qrImageUrl
                          : null;
                      setAccountQrPreview(cleanQr);
                      setAccountQrUrlInput("");
                      setRemoveQrImage(false);
                      setAccountModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                    title="Edit Rekening"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAccount(acc.id, acc.bankName)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Rekening"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: PREVIEW BUKTI TRANSFER */}
      {proofModalUrl && (
        <div
          onClick={() => setProofModalUrl(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 flex items-center justify-center cursor-pointer animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-5 rounded-3xl max-w-lg w-full text-center space-y-3 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setProofModalUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-slate-100 hover:bg-slate-200"
            >
              ✕
            </button>
            <h4 className="font-bold text-slate-900 text-sm">Pratinjau Bukti Transfer</h4>
            <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 p-1">
              <img
                src={proofModalUrl}
                alt="Bukti Transfer"
                className="w-full object-contain mx-auto rounded-lg"
              />
            </div>
            <a
              href={proofModalUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:underline font-bold"
            >
              <span>Buka Gambar Penuh di Tab Baru</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* MODAL 2: TOLAK DONASI */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center animate-in fade-in">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base">
              Tolak Donasi #{rejectModalData.number}
            </h3>
            <p className="text-xs text-slate-600">
              Sebutkan alasan penolakan (misalnya: mutasi tidak ditemukan, bukti pembayaran tidak valid, atau nominal tidak sesuai).
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                rows={3}
                required
                placeholder="Alasan penolakan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                >
                  {isPending ? "Memproses..." : "Konfirmasi Tolak"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH / EDIT KAMPANYE */}
      {campaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 text-lg">
                {editingCampaign ? "Edit Program Kampanye" : "Tambah Program Kampanye Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setCampaignModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                startTransition(async () => {
                  const res = await saveCampaignAction(formData);
                  if (res.success) {
                    showToast("success", res.message || "Kampanye berhasil disimpan.");
                    setCampaignModalOpen(false);
                    router.refresh();
                  } else {
                    showToast("error", res.error || "Gagal menyimpan kampanye.");
                  }
                });
              }}
              className="space-y-4"
            >
              {editingCampaign && (
                <input type="hidden" name="id" value={editingCampaign.id} />
              )}
              {editingCampaign?.coverImage && (
                <input
                  type="hidden"
                  name="existingCoverImage"
                  value={editingCampaign.coverImage}
                />
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Program Kampanye
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingCampaign?.title || ""}
                  placeholder="Contoh: Pengadaan Tenda Regu & Peralatan Pioneering"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <select
                    name="category"
                    defaultValue={editingCampaign?.category || "Sarana & Prasarana"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="Sarana & Prasarana">Sarana & Prasarana</option>
                    <option value="Beasiswa & Pembinaan">Beasiswa & Pembinaan</option>
                    <option value="Sosial & Bencana">Sosial & Pengabdian</option>
                    <option value="Kegiatan & Kemah">Kegiatan & Kemah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Dana (Rp)
                  </label>
                  <input
                    type="number"
                    name="targetAmount"
                    required
                    min={100000}
                    defaultValue={editingCampaign?.targetAmount || 10000000}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi & Rincian Penggunaan
                </label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingCampaign?.description || ""}
                  placeholder="Jelaskan kebutuhan, sasaran penerima manfaat, dan rincian alokasi dana..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={editingCampaign?.status || "ACTIVE"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Aktif Dibuka)</option>
                    <option value="COMPLETED">COMPLETED (Selesai/Terpenuhi)</option>
                    <option value="PAUSED">PAUSED (Ditunda)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Foto Cover
                  </label>
                  <input
                    type="file"
                    name="coverImage"
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white glossy-button-primary shadow-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Program"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH / EDIT REKENING */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 flex items-center justify-center overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl my-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  {editingAccount ? "Edit Rekening / QRIS" : "Tambah Rekening Baru"}
                </h3>
                <p className="text-xs text-slate-500">
                  Rekening atau QRIS akan langsung tampil di halaman donasi publik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                startTransition(async () => {
                  const res = await saveAccountAction(formData);
                  if (res.success) {
                    showToast("success", res.message || "Rekening berhasil disimpan.");
                    if (res.account) {
                      setAccountsList((prev) => {
                        const exists = prev.some((a) => a.id === res.account.id);
                        if (exists) {
                          return prev.map((a) => (a.id === res.account.id ? res.account : a));
                        }
                        return [...prev, res.account];
                      });
                    }
                    setAccountModalOpen(false);
                    router.refresh();
                  } else {
                    showToast("error", res.error || "Gagal menyimpan rekening.");
                  }
                });
              }}
              className="space-y-4"
            >
              {editingAccount && (
                <input type="hidden" name="id" value={editingAccount.id} />
              )}
              {editingAccount?.qrImageUrl && (
                <input
                  type="hidden"
                  name="existingQrImageUrl"
                  value={editingAccount.qrImageUrl}
                />
              )}
              <input
                type="hidden"
                name="removeQrImage"
                value={removeQrImage ? "true" : "false"}
              />
              <input type="hidden" name="isActiveSubmitted" value="1" />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Bank / Saluran Pembayaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  required
                  defaultValue={editingAccount?.bankName || ""}
                  placeholder="Contoh: QRIS Nasional (Semua Bank / Dompet Digital) atau BSI"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Rekening <span className="text-slate-400 font-normal">(Kosongkan jika QRIS)</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    defaultValue={editingAccount?.accountNumber === "QRIS" ? "" : (editingAccount?.accountNumber || "")}
                    placeholder="Contoh: 7198234501 (hanya angka)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Wajib 5–25 digit angka untuk rekening bank (BSI, BCA, Mandiri, dll). Biarkan kosong jika kanal QRIS.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Atas Nama Rekening <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountHolder"
                    required
                    defaultValue={editingAccount?.accountHolder || "PRAMUKA MH SCOUT"}
                    placeholder="Contoh: PRAMUKA MH SCOUT"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Nama pemilik rekening atau merchant resmi QRIS.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan Rekening (Opsional)
                </label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingAccount?.description || ""}
                  placeholder="Contoh: Menerima transfer semua e-wallet & mobile banking"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* QRIS BARCODE UPLOAD SECTION - STRICTLY FILE BASED */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-700" />
                    <span>Upload Berkas Barcode QRIS</span>
                  </label>
                  {accountQrPreview && !removeQrImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveQrImage(true);
                        setAccountQrPreview(null);
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Hapus Barcode
                    </button>
                  )}
                </div>

                {/* Pratinjau Barcode Terpasang atau Berkas Baru yang Dipilih */}
                {accountQrPreview && !removeQrImage ? (
                  <div className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-emerald-300 shadow-2xs">
                    <img
                      src={accountQrPreview}
                      alt="Pratinjau QRIS"
                      className="w-24 h-24 object-contain rounded-lg border border-slate-200 shrink-0 bg-white"
                    />
                    <div className="space-y-1.5 text-xs">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Berkas QRIS Terpasang
                      </span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Barcode ini akan langsung muncul di halaman donasi publik dan popup pembayaran donatur.
                      </p>
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih berkas lain untuk mengganti</span>
                        <input
                          type="file"
                          name="qrImage"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setAccountQrPreview(URL.createObjectURL(f));
                              setRemoveQrImage(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center transition-colors bg-white">
                      <Upload className="w-7 h-7 text-emerald-600 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-800">
                        Pilih file gambar QRIS resmi dari perangkat Anda
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Format didukung: PNG, JPG, JPEG, WEBP (Maksimal 10 MB)
                      </p>
                      <div className="mt-3">
                        <input
                          type="file"
                          name="qrImage"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setAccountQrPreview(URL.createObjectURL(f));
                              setRemoveQrImage(false);
                            }
                          }}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      * Barcode wajib berasal dari berkas asli resmi yang diunggah oleh user admin (bukan tautan URL eksternal generator dummy).
                    </p>
                  </div>
                )}
              </div>

              {/* Status Aktif Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="account-is-active"
                  name="isActive"
                  value="true"
                  defaultChecked={editingAccount ? editingAccount.isActive : true}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="account-is-active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Tampilkan rekening ini sebagai opsi aktif di formulir donasi publik
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white glossy-button-primary shadow-xs"
                >
                  {isPending ? "Menyimpan..." : "Simpan Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
