import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parsePermitLetter } from "@/lib/permit-letter";
import { PermitLetterTemplate } from "@/components/dashboard/PermitLetterTemplate";
import { GeneralLetterTemplate } from "@/components/dashboard/GeneralLetterTemplate";
import { ArrowLeft, Printer } from "lucide-react";
import { getBaseUrl } from "@/lib/share";

export const dynamic = "force-dynamic";

export default async function LetterPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let letter = null;
  let profile = null;

  try {
    const [l, prof] = await Promise.all([
      prisma.letter.findUnique({
        where: { id },
      }),
      prisma.organizationProfile.findFirst(),
    ]);

    letter = l;
    profile = prof
      ? {
          name: prof.name,
          pangkalan: prof.pangkalan,
          address: prof.address,
          phone: prof.phone,
          email: prof.email,
          logoUrl: prof.logoUrl,
        }
      : null;
  } catch {
    // db fallback
  }

  if (!letter) {
    notFound();
  }

  const permitData = parsePermitLetter(letter);
  const printUrl = `${getBaseUrl()}/dashboard/letters/${letter.id}/print`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 print:bg-white print:p-0 print:m-0">
      <div className="max-w-4xl mx-auto space-y-4 print:p-0 print:m-0 print:max-w-none">
        {/* Navigation bar (hidden during print) */}
        <div className="print:hidden flex items-center justify-between">
          <Link
            href="/dashboard/letters"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-emerald-700 shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Administrasi Surat</span>
          </Link>
          <span className="text-xs text-slate-500 font-mono">
            {letter.letterNumber}
          </span>
        </div>

        {/* Letter Template */}
        {permitData ? (
          <PermitLetterTemplate
            data={permitData}
            organization={profile}
            showActions={true}
            printUrl={printUrl}
          />
        ) : (
          <GeneralLetterTemplate
            letter={letter}
            organization={profile}
          />
        )}
      </div>
    </div>
  );
}
