"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
  label?: string;
  className?: string;
}

export function CopyButton({
  textToCopy,
  label = "Salin",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
        copied
          ? "bg-emerald-600 text-white shadow-xs"
          : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
      } ${className}`}
      title="Salin nomor rekening"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>Tersalin!</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-emerald-700" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
