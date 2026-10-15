"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createLetterAction,
  updateLetterAction,
  deleteLetterAction,
} from "@/actions/letters";
import { formatDate } from "@/lib/utils";
import {
  Mail,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Loader2,
  Search,
  Edit2,
  Trash2,
  Eye,
  AlertCircle,
  FileText,
  Download,
  Printer,
  HeartHandshake,
  UserCheck,
  FileCheck2,
} from "lucide-react";
import {
  parsePermitLetter,
  getPermitWhatsAppShareUrl,
  PermitLetterData,
} from "@/lib/permit-letter";
import { PermitLetterModal } from "@/components/dashboard/PermitLetterModal";
import { PermitLetterTemplate } from "@/components/dashboard/PermitLetterTemplate";
import { WhatsAppIcon } from "@/components/public/ShareBar";

interface LettersClientViewProps {
  initialLetters: any[];
  canEdit: boolean;
  members?: any[];
  activities?: any[];
  leaders?: any[];
  organizationProfile?: any;
}

export function LettersClientView({
  initialLetters,
  canEdit,
  members = [],
  activities = [],
  leaders = [],
  organizationProfile,
}: LettersClientViewProps) {
  const router = useRouter();

  // Standard Letter Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<any | null>(null);
  const [detailLetter, setDetailLetter] = useState<any | null>(null);
  const [deletingLetter, setDeletingLetter] = useState<any | null>(null);

  // Permit Letter Modals
  const [permitModalOpen, setPermitModalOpen] = useState(false);
  const [editingPermitData, setEditingPermitData] =
    useState<PermitLetterData | null>(null);
  const [previewPermitData, setPreviewPermitData] =
    useState<PermitLetterData | null>(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      permitModalOpen ||
      previewPermitData !== null ||
      modalOpen ||
      detailLetter !== null ||
      deletingLetter !== null;

    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [
    permitModalOpen,
    previewPermitData,
    modalOpen,
    detailLetter,
    deletingLetter,
  ]);

  const permitLettersCount = initialLetters.filter(
    (l) => parsePermitLetter(l) !== null
  ).length;

  const openAddStandard = () => {
    setEditingLetter(null);
    setError(null);
    setModalOpen(true);
  };

  const openAddPermit = () => {
    setEditingPermitData(null);
    setPermitModalOpen(true);
  };

  const openEdit = (letter: any) => {
    const permitData = parsePermitLetter(letter);
    if (permitData) {
      setEditingPermitData(permitData);
      setPermitModalOpen(true);
    } else {
      setEditingLetter(letter);
      setError(null);
      setModalOpen(true);
    }
  };

  const handleSaveStandard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      let res;
      if (editingLetter) {
        res = await updateLetterAction(editingLetter.id, formData);
      } else {
        res = await createLetterAction(formData);
      }

      if (!res.success) {
        setError(res.error || "Gagal menyimpan data surat.");
        setLoading(false);
      } else {
        setModalOpen(false);
        setEditingLetter(null);
        setLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingLetter) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await deleteLetterAction(deletingLetter.id);
      if (!res.success) {
        setError(res.error || "Gagal menghapus surat.");
        setDeleteLoading(false);
      } else {
        setDeletingLetter(null);
        setDetailLetter(null);
        setDeleteLoading(false);
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
      setDeleteLoading(false);
    }
  };

  const filtered = initialLetters.filter((l) => {
    const isPermit = parsePermitLetter(l) !== null;
    let match = true;

    if (typeFilter === "IZIN") {
      if (!isPermit) match = false;
    } else if (typeFilter === "MASUK") {
      if (l.type !== "MASUK") match = false;
    } else if (typeFilter === "KELUAR") {
      if (l.type !== "KELUAR" || isPermit) match = false;
    }

    if (search) {
      const q = search.toLowerCase();
      match =
        match &&
        (l.subject.toLowerCase().includes(q) ||
          l.letterNumber.toLowerCase().includes(q) ||
          (l.sender && l.sender.toLowerCase().includes(q)) ||
          (l.recipient && l.recipient.toLowerCase().includes(q)) ||
          (l.summary && l.summary.toLowerCase().includes(q)));
    }
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Top CTA Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrasi Surat Gugus Depan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan surat masuk, surat keluar, dan pembuatan surat izin anggota ({initialLetters.length} dokumen tercatat)
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Primary Button: Buat Surat Izin Anggota */}
            <button
              type="button"
              onClick={openAddPermit}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Buat Surat Izin Anggota</span>
            </button>

            {/* Secondary Button: Catat Surat Biasa */}
            <button
              type="button"
              onClick={openAddStandard}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Surat Masuk/Keluar</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setTypeFilter("")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              !typeFilter
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Semua ({initialLetters.length})
          </button>

          {/* Surat Izin Tab with Badge */}
          <button
            type="button"
            onClick={() => setTypeFilter("IZIN")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === "IZIN"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Surat Izin Anggota ({permitLettersCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("MASUK")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === "MASUK"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Surat Masuk
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("KELUAR")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              typeFilter === "KELUAR"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Surat Keluar Lainnya
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama anggota, perihal, atau nomor surat..."
            className="w-full pl-8 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 shadow-2xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* LETTERS LIST / TABLE */}
      {filtered.length > 0 ? (
        <>
          {/* Mobile Cards (Visible on screens < sm) */}
          <div className="sm:hidden space-y-3">
            {filtered.map((l) => {
              const permitData = parsePermitLetter(l);
              const isPermit = permitData !== null;

              return (
                <div
                  key={l.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      {isPermit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <UserCheck className="w-3 h-3 text-emerald-700" />
                          <span>SURAT IZIN</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            l.type === "MASUK"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {l.type === "MASUK" ? (
                            <ArrowDownLeft className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{l.type}</span>
                        </span>
                      )}

                      <span className="font-mono text-xs font-bold text-slate-700 truncate">
                        {l.letterNumber}
                      </span>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        l.status === "DIKIRIM" || l.status === "DITERIMA"
                          ? "bg-emerald-100 text-emerald-800"
                          : l.status === "DIARSIPKAN"
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>

                  {/* Subject & Summary */}
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                      {l.subject}
                    </h4>
                    {isPermit && permitData && (
                      <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            👤 {permitData.memberName}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            Regu {permitData.groupName}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">
                          💬 "{permitData.reason}"
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1.5">
                      <span>{formatDate(l.date)}</span>
                      <span>•</span>
                      <span className="truncate">
                        {l.type === "MASUK"
                          ? `Dari: ${l.sender || "-"}`
                          : `Tujuan: ${l.recipient || "-"}`}
                      </span>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
                    {isPermit && permitData ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewPermitData(permitData)}
                          className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const printUrl =
                              typeof window !== "undefined"
                                ? `${window.location.origin}/dashboard/letters/${l.id}/print`
                                : "";
                            const waUrl = getPermitWhatsAppShareUrl(
                              permitData,
                              printUrl
                            );
                            window.open(waUrl, "_blank");
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-[#25D366] hover:text-white transition-all"
                          title="Share WhatsApp"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDetailLetter(l)}
                        className="font-bold text-slate-700 hover:text-emerald-700"
                      >
                        Detail Surat
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(l)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Ubah Surat"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingLetter(l);
                              setError(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Hapus Surat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Visible on screens >= sm) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Jenis Surat</th>
                  <th className="p-4">Nomor Surat</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Perihal / Keterangan</th>
                  <th className="p-4">Pihak Terkait</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Aksi & Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => {
                  const permitData = parsePermitLetter(l);
                  const isPermit = permitData !== null;

                  return (
                    <tr
                      key={l.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Jenis Surat */}
                      <td className="p-4">
                        {isPermit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <UserCheck className="w-3 h-3 text-emerald-700" />
                            <span>SURAT IZIN</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${
                              l.type === "MASUK"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {l.type === "MASUK" ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            <span>{l.type}</span>
                          </span>
                        )}
                      </td>

                      {/* Nomor Surat */}
                      <td className="p-4 font-mono font-medium text-slate-700">
                        {l.letterNumber}
                      </td>

                      {/* Tanggal */}
                      <td className="p-4 text-slate-600 whitespace-nowrap">
                        {formatDate(l.date)}
                      </td>

                      {/* Perihal / Keterangan */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900 max-w-sm line-clamp-1">
                          {l.subject}
                        </div>
                        {isPermit && permitData && (
                          <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            Anggota:{" "}
                            <span className="font-semibold text-slate-800">
                              {permitData.memberName}
                            </span>{" "}
                            ({permitData.permitType === "SAKIT" ? "Sakit" : "Izin"})
                          </div>
                        )}
                      </td>

                      {/* Pihak Terkait */}
                      <td className="p-4 text-slate-600 max-w-xs truncate">
                        {isPermit && permitData ? (
                          <span>
                            Wali: {permitData.parentName || "-"}
                          </span>
                        ) : l.type === "MASUK" ? (
                          l.sender || "-"
                        ) : (
                          l.recipient || "-"
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            l.status === "DIKIRIM" || l.status === "DITERIMA"
                              ? "bg-emerald-100 text-emerald-800"
                              : l.status === "DIARSIPKAN"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>

                      {/* Aksi & Dokumen */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPermit && permitData ? (
                            <>
                              {/* Preview & Download PDF Button */}
                              <button
                                type="button"
                                onClick={() => setPreviewPermitData(permitData)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-all cursor-pointer"
                                title="Lihat & Unduh Dokumen PDF Resmi"
                              >
                                <Download className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Unduh PDF</span>
                              </button>

                              {/* WhatsApp Share Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const printUrl =
                                    typeof window !== "undefined"
                                      ? `${window.location.origin}/dashboard/letters/${l.id}/print`
                                      : "";
                                  const waUrl = getPermitWhatsAppShareUrl(
                                    permitData,
                                    printUrl
                                  );
                                  window.open(waUrl, "_blank");
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-[#25D366] text-emerald-800 hover:text-white transition-all cursor-pointer"
                                title="Bagikan ke WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDetailLetter(l)}
                              className="px-2 py-1 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 font-semibold"
                            >
                              Detail
                            </button>
                          )}

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(l)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Ubah Surat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingLetter(l);
                                  setError(null);
                                }}
                                className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Hapus Surat"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="font-semibold text-slate-700 text-sm">
            Belum ada arsip surat.
          </p>
          <p className="text-slate-400 text-xs mt-0.5">
            Buat surat izin anggota atau catat surat masuk/keluar baru untuk pangkalan.
          </p>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: BUAT / EDIT SURAT IZIN ANGGOTA */}
      {/* ============================================================== */}
      {permitModalOpen && (
        <PermitLetterModal
          isOpen={permitModalOpen}
          onClose={() => {
            setPermitModalOpen(false);
            setEditingPermitData(null);
          }}
          onSuccess={(savedLetter) => {
            setPermitModalOpen(false);
            setEditingPermitData(null);
            router.refresh();

            // Automatically open preview modal for immediate print & share!
            const parsed = parsePermitLetter(savedLetter);
            if (parsed) {
              setPreviewPermitData(parsed);
            }
          }}
          initialData={editingPermitData}
          members={members}
          activities={activities}
          leaders={leaders}
          organizationProfile={organizationProfile}
          existingCount={initialLetters.length}
        />
      )}

      {/* ============================================================== */}
      {/* MODAL 2: PRATINJAU & CETAK PDF / WHATSAPP SURAT IZIN */}
      {/* ============================================================== */}
      {previewPermitData && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white sm:rounded-3xl shadow-2xl border-x sm:border border-slate-100 my-0 sm:my-8 overflow-hidden p-3 sm:p-6 min-h-screen sm:min-h-0">
            <PermitLetterTemplate
              data={previewPermitData}
              organization={organizationProfile}
              showActions={true}
              onClose={() => setPreviewPermitData(null)}
              printUrl={
                typeof window !== "undefined"
                  ? `${window.location.origin}/dashboard/letters/${previewPermitData.id || ""}/print`
                  : ""
              }
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: TAMBAH / UBAH SURAT BIASA (STANDAR) */}
      {/* ============================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-base text-slate-900">
                {editingLetter ? "Ubah Data Surat Biasa" : "Catat Arsip Surat Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveStandard} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jenis Surat *
                  </label>
                  <select
                    name="type"
                    defaultValue={editingLetter?.type || "MASUK"}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="MASUK">Surat Masuk</option>
                    <option value="KELUAR">Surat Keluar</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Tanggal Surat *
                  </label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={
                      editingLetter
                        ? new Date(editingLetter.date).toISOString().split("T")[0]
                        : new Date().toISOString().split("T")[0]
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nomor Surat Resmi *
                </label>
                <input
                  type="text"
                  name="letterNumber"
                  required
                  placeholder="Contoh: 005/GUD-MH/UND/X/2026"
                  defaultValue={editingLetter?.letterNumber || ""}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Perihal / Judul Surat *
                </label>
                <input
                  type="text"
                  name="subject"
                  required
                  placeholder="Contoh: Undangan Rapat Koordinasi Pembina Gugus Depan"
                  defaultValue={editingLetter?.subject || ""}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Pengirim
                  </label>
                  <input
                    type="text"
                    name="sender"
                    placeholder="Instansi / Nama"
                    defaultValue={editingLetter?.sender || ""}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Penerima / Tujuan
                  </label>
                  <input
                    type="text"
                    name="recipient"
                    placeholder="Tujuan Surat"
                    defaultValue={editingLetter?.recipient || ""}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Status Berkas
                </label>
                <select
                  name="status"
                  defaultValue={editingLetter?.status || "DRAF"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="DRAF">DRAF</option>
                  <option value="DIKIRIM">DIKIRIM</option>
                  <option value="DITERIMA">DITERIMA</option>
                  <option value="DIARSIPKAN">DIARSIPKAN</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ringkasan Isi Surat (Opsional)
                </label>
                <textarea
                  name="summary"
                  rows={2}
                  placeholder="Keterangan singkat pokok bahasan surat..."
                  defaultValue={editingLetter?.summary || ""}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? "Menyimpan..." : "Simpan Surat"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: DETAIL SURAT STANDAR */}
      {/* ============================================================== */}
      {detailLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                    detailLetter.type === "MASUK"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {detailLetter.type === "MASUK" ? "SURAT MASUK" : "SURAT KELUAR"}
                </span>
                <span className="font-mono text-xs text-slate-600 font-bold">
                  {detailLetter.letterNumber}
                </span>
              </div>
              <button type="button" onClick={() => setDetailLetter(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Perihal
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-0.5">
                  {detailLetter.subject}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Tanggal Surat
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {formatDate(detailLetter.date)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Status
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {detailLetter.status}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Pengirim
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {detailLetter.sender || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Penerima / Tujuan
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {detailLetter.recipient || "-"}
                  </p>
                </div>
              </div>

              {detailLetter.summary && (
                <div className="p-3 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Ringkasan Isi Surat
                  </span>
                  <p className="text-slate-700 leading-relaxed mt-1">
                    {detailLetter.summary}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setDetailLetter(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: PRATINJAU & UNDUH SURAT IZIN RESMI */}
      {/* ============================================================== */}
      {previewPermitData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:bg-transparent print:backdrop-blur-none print:p-0 print:m-0 print:overflow-visible print:static">
          <div className="max-w-4xl w-full my-auto py-4 animate-in zoom-in-95 duration-150 print:p-0 print:m-0 print:max-w-none">
            <PermitLetterTemplate
              data={previewPermitData}
              organization={organizationProfile}
              showActions={true}
              onClose={() => setPreviewPermitData(null)}
              printUrl={
                typeof window !== "undefined" && previewPermitData.id
                  ? `${window.location.origin}/dashboard/letters/${previewPermitData.id}/print`
                  : undefined
              }
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: KONFIRMASI HAPUS SURAT */}
      {/* ============================================================== */}
      {deletingLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">
                Hapus Arsip Surat?
              </h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus arsip surat{" "}
                <span className="font-bold text-slate-800">
                  {deletingLetter.letterNumber}
                </span>{" "}
                ({deletingLetter.subject})?
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingLetter(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                {deleteLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>
                  {deleteLoading ? "Menghapus..." : "Ya, Hapus Surat"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
