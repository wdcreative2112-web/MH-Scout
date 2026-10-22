import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { StructureOrgChart } from "@/components/public/StructureOrgChart";
import { Network, Building, ArrowLeft, ShieldCheck } from "lucide-react";

import { mergeStructureWithTemplate } from "@/lib/structure-constants";

export const dynamic = "force-dynamic";

export default async function PublicStructurePage() {
  let profile = null;
  let structure: any[] = [];

  try {
    const [prof, groups] = await Promise.all([
      prisma.organizationProfile.findFirst(),
      prisma.scoutGroup.findMany({ select: { id: true, name: true } }),
    ]);
    profile = prof;

    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    let parsedStructure: any[] = [];
    if (profile?.structure) {
      const parsed = JSON.parse(profile.structure);
      if (Array.isArray(parsed)) {
        parsedStructure = parsed.map((sec: any) => ({
          ...sec,
          members: Array.isArray(sec.members)
            ? sec.members.map((m: any) => {
                const groupIds: string[] = Array.isArray(m.groupIds) ? m.groupIds : [];
                const groupNames = Array.isArray(m.groupNames) && m.groupNames.length > 0
                  ? m.groupNames
                  : groupIds.map((id) => groupMap.get(id)).filter(Boolean);
                return {
                  ...m,
                  groupNames,
                };
              })
            : [],
        }));
      }
    }
    structure = mergeStructureWithTemplate(parsedStructure);
  } catch {}

  const pangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";
  const orgName = profile?.name || "Gugus Depan MH SCOUT";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* Header Banner */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="relative rounded-3xl lg:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071912] p-8 sm:p-12 text-white border border-emerald-500/20 shadow-[0_20px_50px_rgba(9,34,24,0.4)]">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md text-xs font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <Network className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bagan Organisasi Resmi</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Struktur Kepengurusan
            </h1>
            <p className="text-emerald-300 font-medium text-sm sm:text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{orgName} — {pangkalan}</span>
            </p>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl pt-1">
              Bagan kepengurusan resmi yang mengemban amanah pengelolaan, bimbingan, dan pembinaan karakter kepanduan bagi peserta didik di pangkalan.
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Org Chart Body */}
      <ScrollReveal direction="up" delayMs={100}>
        <StructureOrgChart sections={structure} />
      </ScrollReveal>

      {/* Footer Navigation */}
      <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Profil</span>
        </Link>
      </div>
    </div>
  );
}
