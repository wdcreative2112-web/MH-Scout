"use client";

import React, { useState, useTransition } from "react";
import {
  Heart,
  X,
  CreditCard,
  QrCode,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { DonationCampaign, DonationAccount } from "@/types";
import { submitDonationAction } from "@/actions/donations";
import { CopyButton } from "./CopyButton";
import { formatRupiah } from "@/lib/utils";

interface DonationModalFormProps {
  campaigns: DonationCampaign[];
  accounts: DonationAccount[];
  initialCampaignId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AMOUNTS = [
  25000,
  50000,
  100000,
  250000,
  500000,
  1000000,
];

export function DonationModalForm({
  campaigns,
  accounts,
  initialCampaignId = null,
  isOpen,
  onClose,
}: DonationModalFormProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaignId || ""
  );
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [message, setMessage] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    accounts[0]?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<"TRANSFER_BANK" | "QRIS">(
    "TRANSFER_BANK"
  );
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentAccount =
    accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleAmountPreset = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setCustomAmount(val);
    setIsCustom(true);
    setSelectedAmount(val ? parseInt(val, 10) : 0);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const finalAmount = isCustom
      ? parseInt(customAmount, 10) || 0
      : selectedAmount;

    if (finalAmount < 10000) {
      setErrorMessage("Nominal donasi minimal adalah Rp 10.000.");
      return;
    }

    if (!isAnonymous && !donorName.trim()) {
      setErrorMessage("Silakan isi nama Anda atau pilih opsi Hamba Allah / Anonim.");
      return;
    }

    const formData = new FormData();
    formData.append("donorName", isAnonymous ? "Hamba Allah" : donorName);
    formData.append("isAnonymous", isAnonymous ? "true" : "false");
    formData.append("donorEmail", donorEmail);
    formData.append("donorPhone", donorPhone);
    formData.append("amount", String(finalAmount));
    formData.append("campaignId", selectedCampaignId || "");
    formData.append("paymentMethod", paymentMethod);
    formData.append(
      "bankName",
      currentAccount ? currentAccount.bankName : "Transfer Bank"
    );
    formData.append("message", message);
    if (proofFile) {
      formData.append("proof", proofFile);
    }

    startTransition(async () => {
      const res = await submitDonationAction(formData);
      if (res.success) {
        setSuccessResult(res.donation);
      } else {
        setErrorMessage(res.error || "Gagal mengirim donasi.");
      }
    });
  };

  const resetForm = () => {
    setSuccessResult(null);
    setProofPreview(null);
    setProofFile(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
        {/* Header Modal */}
        <div className="relative bg-gradient-to-r from-scout-950 via-scout-900 to-emerald-950 text-white p-5 sm:p-7">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />
          <button
            type="button"
            onClick={resetForm}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-semibold w-fit mb-2 shadow-xs">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Infak & Donasi Kepramukaan</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Formulir Donasi & Konfirmasi
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
            Dukung pendidikan karakter, sarana prasarana perkemahan, dan beasiswa adik-adik Pramuka MH SCOUT.
          </p>
        </div>

        {/* Modal Body */}
        {successResult ? (
          <div className="p-6 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto shadow-inner animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">
                Terima Kasih atas Kebaikan Anda!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Konfirmasi donasi Anda telah kami terima dan tercatat di sistem kami dengan rincian berikut:
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="glossy-panel p-5 rounded-2xl border border-slate-200/90 text-left space-y-3 max-w-md mx-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Nomor Donasi</span>
                <span className="font-mono font-bold text-scout-950">
                  {successResult.donationNumber}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Donatur</span>
                <span className="font-bold text-slate-900">
                  {successResult.isAnonymous ? "Hamba Allah" : successResult.donorName}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Program / Penyaluran</span>
                <span className="font-semibold text-emerald-800 text-right truncate max-w-[200px]">
                  {successResult.campaignTitle || "Donasi Umum Pangkalan"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 font-semibold">Total Donasi</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  {formatRupiah(successResult.amount)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
              Status donasi saat ini sedang dalam proses verifikasi oleh Bendahara Gugus Depan. Semoga menjadi amal jariyah yang berlipat ganda.
            </p>

            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl text-white font-bold text-xs sm:text-sm glossy-button-primary shadow-md active:scale-95 transition-all"
            >
              Tutup & Kembali ke Halaman Donasi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <span>⚠️ {errorMessage}</span>
              </div>
            )}

            {/* 1. Pilih Program / Kampanye */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Alokasi Program Donasi
              </label>
              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-slate-50/50"
              >
                <option value="">Donasi Bebas / Kas Umum Pangkalan MH SCOUT</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pilih Nominal Donasi */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Pilih Nominal Donasi
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((amt) => {
                  const isChosen = !isCustom && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountPreset(amt)}
                      className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                        isChosen
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-xs scale-[1.02]"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      {formatRupiah(amt)}
                    </button>
                  );
                })}
              </div>

              {/* Input Nominal Kustom */}
              <div className="relative mt-2">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="Atau ketik nominal kustom (contoh: 75.000)"
                  value={customAmount}
                  onChange={handleCustomAmountChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-600 ${
                    isCustom
                      ? "border-emerald-600 bg-emerald-50/20 text-emerald-950 font-bold"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                />
              </div>
            </div>

            {/* 3. Metode Pembayaran & Rekening */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Metode Pembayaran & Tujuan Transfer
              </label>

              {/* Tabs Method */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER_BANK")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    paymentMethod === "TRANSFER_BANK"
                      ? "bg-emerald-900 text-white border-emerald-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("QRIS")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    paymentMethod === "QRIS"
                      ? "bg-emerald-900 text-white border-emerald-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Scan QRIS</span>
                </button>
              </div>

              {/* Account Selector Card */}
              {accounts.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/80 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600">
                      Pilih Rekening Tujuan:
                    </label>
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-emerald-300 text-xs font-semibold bg-white text-slate-800"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName} - {acc.accountHolder}
                        </option>
                      ))}
                    </select>
                  </div>

                  {currentAccount && (
                    <div className="pt-2 border-t border-emerald-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                          Nomor Rekening / ID:
                        </p>
                        <p className="font-mono text-base font-black text-emerald-950">
                          {currentAccount.accountNumber}
                        </p>
                        <p className="text-xs text-slate-600">
                          a.n. <strong>{currentAccount.accountHolder}</strong>
                        </p>
                      </div>

                      <div className="shrink-0">
                        <CopyButton
                          textToCopy={currentAccount.accountNumber}
                          label="Salin Rekening"
                        />
                      </div>
                    </div>
                  )}

                  {/* QRIS Image View if QRIS Selected */}
                  {paymentMethod === "QRIS" && currentAccount?.qrImageUrl && (
                    <div className="pt-2 text-center">
                      <div className="inline-block p-2 bg-white rounded-2xl border border-slate-200 shadow-xs">
                        <img
                          src={currentAccount.qrImageUrl}
                          alt="QRIS Donasi"
                          className="w-44 h-44 object-contain mx-auto"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Scan QRIS dengan aplikasi mobile banking atau e-wallet apa saja.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Data Donatur */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Data Donatur & Doa
              </label>

              {/* Anonim Toggle */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  type="checkbox"
                  id="isAnonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 border-slate-300"
                />
                <label
                  htmlFor="isAnonymous"
                  className="text-xs font-semibold text-slate-700 select-none cursor-pointer"
                >
                  Sembunyikan nama saya dari publik (Tampilkan sebagai Hamba Allah)
                </label>
              </div>

              {!isAnonymous && (
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Nama Lengkap / Komunitas
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: Kak Budi Santoso / Alumni 2020"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Nomor WhatsApp / HP (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0812xxxxxxxx"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Email Resmi (Opsional)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              {/* Pesan & Doa */}
              <div>
                <label className="block text-xs text-slate-600 font-medium mb-1">
                  Pesan & Doa untuk Adik-adik Pramuka
                </label>
                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Tuliskan doa atau pesan semangat untuk adik-adik penggalang dan penegak..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* 5. Unggah Bukti Transfer */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                5. Bukti Transfer / Resi Pembayaran
              </label>
              <div className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 text-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleProofChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {proofPreview ? (
                  <div className="space-y-2">
                    <img
                      src={proofPreview}
                      alt="Pratinjau Bukti"
                      className="h-28 object-contain mx-auto rounded-lg border border-slate-200"
                    />
                    <p className="text-xs font-semibold text-emerald-700">
                      Klik untuk mengganti gambar bukti transfer
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">
                      Pilih atau Seret Foto / Tangkapan Layar Bukti Transfer
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Format: JPG, PNG, WEBP (Maksimal 10 MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 py-3.5 px-6 rounded-xl text-white font-bold text-xs sm:text-sm glossy-button-primary flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <span>Mengirim Konfirmasi Donasi...</span>
                ) : (
                  <>
                    <span>Kirim Donasi & Konfirmasi Sekarang</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="py-3 px-5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs sm:text-sm font-semibold transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
