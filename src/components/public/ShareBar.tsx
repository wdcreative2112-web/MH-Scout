"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Download, Share2, Sparkles, ExternalLink } from "lucide-react";
import { getWhatsAppShareUrl, formatWhatsAppMessage, getAbsoluteUrl } from "@/lib/share";

interface ShareBarProps {
  title: string;
  summary?: string | null;
  slug: string;
  type: "berita" | "artikel";
  coverImage?: string | null;
  category?: string | null;
  variant?: "compact" | "banner" | "card-icon";
  className?: string;
}

/**
 * High-precision official WhatsApp SVG icon.
 */
export function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM8.53 7.33C8.37 7.33 8.1 7.39 7.87 7.64C7.65 7.89 7.02 8.48 7.02 9.7C7.02 10.92 7.91 12.09 8.03 12.25C8.16 12.41 9.77 14.9 12.25 15.97C14.31 16.86 14.73 16.68 15.18 16.64C15.63 16.6 16.63 16.05 16.84 15.46C17.05 14.87 17.05 14.36 16.99 14.26C16.93 14.16 16.76 14.1 16.51 13.98C16.26 13.85 15.04 13.25 14.81 13.17C14.58 13.09 14.42 13.05 14.25 13.3C14.09 13.55 13.62 14.1 13.47 14.26C13.33 14.43 13.18 14.45 12.93 14.32C12.69 14.2 11.89 13.94 10.95 13.1C10.22 12.45 9.72 11.64 9.58 11.4C9.44 11.15 9.56 11.02 9.69 10.89C9.8 10.78 9.94 10.6 10.06 10.45C10.19 10.31 10.23 10.21 10.31 10.04C10.39 9.88 10.35 9.73 10.29 9.61C10.23 9.49 9.75 8.32 9.55 7.83C9.36 7.35 9.16 7.42 9.01 7.41C8.87 7.41 8.7 7.33 8.53 7.33Z" />
    </svg>
  );
}

export function ShareBar({
  title,
  summary,
  slug,
  type,
  coverImage,
  category,
  variant = "compact",
  className = "",
}: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);

  useEffect(() => {
    // Generate canonical client URL safely
    const path = `/${type}/${slug}`;
    if (typeof window !== "undefined") {
      setFullUrl(`${window.location.origin}${path}`);
      setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
    } else {
      setFullUrl(getAbsoluteUrl(path));
    }
  }, [type, slug]);

  const targetUrl = fullUrl || getAbsoluteUrl(`/${type}/${slug}`);

  const handleWhatsAppShare = () => {
    const waUrl = getWhatsAppShareUrl({
      title,
      summary,
      url: targetUrl,
      category,
    });
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(targetUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = targetUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // ignore
    }
  };

  // Mobile Web Share with attached Image if supported
  const handleShareWithImage = async () => {
    if (!canNativeShare) {
      handleWhatsAppShare();
      return;
    }

    setIsSharingImage(true);
    try {
      const shareText = formatWhatsAppMessage({
        title,
        summary,
        url: targetUrl,
        category,
      });

      // Try sharing with file attachment if coverImage is available
      if (coverImage && navigator.canShare) {
        try {
          const res = await fetch(coverImage);
          if (res.ok) {
            const blob = await res.blob();
            const ext = blob.type.split("/")[1] || "jpg";
            const file = new File([blob], `${slug}.${ext}`, { type: blob.type });

            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title,
                text: shareText,
                files: [file],
              });
              setIsSharingImage(false);
              return;
            }
          }
        } catch {
          // If CORS prevents blob fetch, fallback to standard share
        }
      }

      // Fallback native share without binary file
      await navigator.share({
        title,
        text: shareText,
        url: targetUrl,
      });
    } catch (err: any) {
      // User cancelled or share aborted
      if (err.name !== "AbortError") {
        handleWhatsAppShare();
      }
    } finally {
      setIsSharingImage(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!coverImage) return;
    try {
      const res = await fetch(coverImage);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foto-${type}-${slug}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // fallback: open in new tab
      window.open(coverImage, "_blank");
    }
  };

  // ==========================================
  // VARIANT: CARD ICON (for list pages)
  // ==========================================
  if (variant === "card-icon") {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWhatsAppShare();
          }}
          className="p-2 rounded-xl bg-emerald-50 hover:bg-[#25D366] text-emerald-800 hover:text-white border border-emerald-200/90 shadow-2xs hover:shadow-md transition-all active:scale-95 group/wa cursor-pointer"
          title="Bagikan ke WhatsApp"
          aria-label="Bagikan ke WhatsApp"
        >
          <WhatsAppIcon className="w-4 h-4 transition-transform group-hover/wa:scale-110" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCopyLink(e);
          }}
          className="p-2 rounded-xl bg-white/80 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80 shadow-2xs transition-all active:scale-95 cursor-pointer"
          title={copied ? "Tersalin!" : "Salin Tautan"}
          aria-label="Salin Tautan"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600 animate-in zoom-in" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>
    );
  }

  // ==========================================
  // VARIANT: COMPACT (top of article/news)
  // ==========================================
  if (variant === "compact") {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 border border-emerald-200/60 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs">
            <WhatsAppIcon className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700 hidden sm:inline">
            Bagikan warta ini:
          </span>
          <span className="text-xs font-bold text-slate-700 sm:hidden">
            Bagikan:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Main WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            title="Kirim ke WhatsApp lengkap dengan preview foto & rangkuman"
          >
            <WhatsAppIcon className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          {/* Mobile Native Share (if supported) */}
          {canNativeShare && (
            <button
              type="button"
              disabled={isSharingImage}
              onClick={handleShareWithImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 text-white hover:bg-emerald-900 active:scale-95 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Bagikan lengkap dengan file gambar ke aplikasi lain"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isSharingImage ? "Memproses..." : "Kirim Lengkap"}
              </span>
            </button>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              copied
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/80"
            }`}
            title="Salin tautan ke clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Salin Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIANT: BANNER (bottom of article/news)
  // ==========================================
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c2b20] via-[#082018] to-[#04120d] text-white p-5 sm:p-7 shadow-[0_15px_35px_-10px_rgba(4,18,13,0.5)] border border-emerald-500/25 ${className}`}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] text-[11px] font-bold">
            <WhatsAppIcon className="w-3 h-3" />
            <span>Bagikan ke WhatsApp</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Sebarkan Warta & Materi Ini ke Rekan Pramuka!
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
            Kirimkan informasi ini ke grup regu, ambalan, pembina, atau orang tua murid. Tautan akan otomatis menampilkan judul, foto kegiatan, dan ringkasan lengkap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Main WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <WhatsAppIcon className="w-4 h-4" />
            <span>Kirim ke WhatsApp</span>
          </button>

          {/* Share with Image Blob on Mobile */}
          {canNativeShare && (
            <button
              type="button"
              disabled={isSharingImage}
              onClick={handleShareWithImage}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold text-xs sm:text-sm border border-white/20 transition-all cursor-pointer"
              title="Kirim ke aplikasi lain"
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharingImage ? "Menyiapkan..." : "Bagikan Lengkap"}</span>
            </button>
          )}

          {/* Download Cover Image */}
          {coverImage && (
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 active:scale-95 text-emerald-200 hover:text-white font-semibold text-xs border border-emerald-500/30 transition-all cursor-pointer"
              title="Unduh foto kegiatan ini ke perangkat Anda"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Foto</span>
            </button>
          )}

          {/* Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
              copied
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
