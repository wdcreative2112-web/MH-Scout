import React from "react";
import { Shield, Award, UserCheck, HeartHandshake, Phone, Mail, Users, Building2 } from "lucide-react";

interface MemberItem {
  id: string;
  name: string;
  roleTitle?: string;
  nip?: string;
  phone?: string;
  photo?: string | null;
  groupNames?: string[];
}

interface SectionItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  members: MemberItem[];
}

export function StructureOrgChart({ sections }: { sections: SectionItem[] }) {
  if (!sections || sections.length === 0) {
    return (
      <div className="py-12 text-center bg-white/70 rounded-3xl border border-slate-200 p-8">
        <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
        <h3 className="font-bold text-base text-slate-800">Struktur Belum Dikonfigurasi</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Susunan struktur kepengurusan pangkalan sedang dalam proses pembaharuan oleh pengurus.
        </p>
      </div>
    );
  }

  const pimpinanSections = sections.filter((s) => s.category === "PIMPINAN");
  const putraSections = sections.filter((s) => s.category === "PEMBINA PUTRA");
  const putriSections = sections.filter((s) => s.category === "PEMBINA PUTRI");
  const pembantuSections = sections.filter((s) => s.category === "PEMBANTU PEMBINA");
  const alumniSections = sections.filter((s) => s.category === "PERWAKILAN ALUMNI");
  const mabigusSections = sections.filter((s) => s.category === "MABIGUS");

  return (
    <div className="space-y-12">
      {/* 1. LEVEL PIMPINAN INTI */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-2">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Pimpinan Inti Gugus Depan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {pimpinanSections.map((sec) => (
            <SectionGroupCard key={sec.id} section={sec} badgeColor="emerald" />
          ))}
        </div>
      </div>

      {/* 2. LEVEL PEMBINA SATUAN PUTRA & PUTRI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pembina Putra */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-blue-500/20 pb-2">
            <Award className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Pembina Satuan Putra</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {putraSections.map((sec) => (
              <SectionGroupCard key={sec.id} section={sec} badgeColor="blue" />
            ))}
          </div>
        </div>

        {/* Pembina Putri */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-pink-500/20 pb-2">
            <Award className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-bold text-slate-900">Pembina Satuan Putri</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {putriSections.map((sec) => (
              <SectionGroupCard key={sec.id} section={sec} badgeColor="pink" />
            ))}
          </div>
        </div>
      </div>

      {/* 3. LEVEL PEMBANTU PEMBINA & PERWAKILAN ALUMNI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pembantu Pembina */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-500/20 pb-2">
            <UserCheck className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-bold text-slate-900">Pembantu Pembina</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {pembantuSections.map((sec) => (
              <SectionGroupCard key={sec.id} section={sec} badgeColor="amber" />
            ))}
          </div>
        </div>

        {/* Perwakilan Alumni */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-purple-500/20 pb-2">
            <HeartHandshake className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Perwakilan Alumni Pramuka</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {alumniSections.map((sec) => (
              <SectionGroupCard key={sec.id} section={sec} badgeColor="purple" />
            ))}
          </div>
        </div>
      </div>

      {/* 4. LEVEL MAJELIS PEMBIMBING GUGUS DEPAN (MABIGUS) */}
      {mabigusSections.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-500/20 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shadow-2xs">
                <Building2 className="w-4 h-4 text-teal-700" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Majelis Pembimbing Gugus Depan (Mabigus)
                </h3>
                <p className="text-xs text-slate-500">Unsur pengarah, pembimbingan, dan dukungan kelembagaan pangkalan</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 self-start sm:self-auto">
              6 Jabatan Pengurus
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {mabigusSections.map((sec) => (
              <SectionGroupCard key={sec.id} section={sec} badgeColor="teal" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionGroupCard({
  section,
  badgeColor = "emerald",
}: {
  section: SectionItem;
  badgeColor?: "emerald" | "blue" | "pink" | "amber" | "purple" | "teal";
}) {
  const colorMap = {
    emerald: {
      badge: "bg-emerald-100/70 text-emerald-800 border-emerald-200",
      avatarBg: "bg-emerald-50 border-emerald-200 text-emerald-800",
      roleText: "text-emerald-700",
      phoneText: "text-emerald-600 hover:bg-emerald-50",
    },
    blue: {
      badge: "bg-blue-100/70 text-blue-800 border-blue-200",
      avatarBg: "bg-blue-50 border-blue-200 text-blue-800",
      roleText: "text-blue-700",
      phoneText: "text-blue-600 hover:bg-blue-50",
    },
    pink: {
      badge: "bg-pink-100/70 text-pink-800 border-pink-200",
      avatarBg: "bg-pink-50 border-pink-200 text-pink-800",
      roleText: "text-pink-700",
      phoneText: "text-pink-600 hover:bg-pink-50",
    },
    amber: {
      badge: "bg-amber-100/70 text-amber-800 border-amber-200",
      avatarBg: "bg-amber-50 border-amber-200 text-amber-800",
      roleText: "text-amber-700",
      phoneText: "text-amber-600 hover:bg-amber-50",
    },
    purple: {
      badge: "bg-purple-100/70 text-purple-800 border-purple-200",
      avatarBg: "bg-purple-50 border-purple-200 text-purple-800",
      roleText: "text-purple-700",
      phoneText: "text-purple-600 hover:bg-purple-50",
    },
    teal: {
      badge: "bg-teal-100/70 text-teal-800 border-teal-200",
      avatarBg: "bg-teal-50 border-teal-200 text-teal-800",
      roleText: "text-teal-700",
      phoneText: "text-teal-600 hover:bg-teal-50",
    },
  }[badgeColor];

  const hasMembers = section.members && section.members.length > 0;

  return (
    <div className="glossy-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between border border-white/80 space-y-3.5 hover:shadow-lg transition-all duration-300">
      <div className="border-b border-slate-100 pb-2.5">
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${colorMap.badge}`}
        >
          {section.title}
        </span>
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{section.subtitle}</p>
      </div>

      {hasMembers ? (
        <div className="space-y-3">
          {section.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-2xs transition-all"
            >
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 font-black text-base shadow-2xs overflow-hidden ${colorMap.avatarBg}`}
              >
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  member.name.charAt(0) || "P"
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  {member.name || "(Nama belum diisi)"}
                </h4>
                {member.roleTitle && (
                  <p className={`text-[11px] font-semibold truncate ${colorMap.roleText}`}>
                    {member.roleTitle}
                  </p>
                )}
                {member.nip && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">NTA: {member.nip}</p>
                )}
                {member.groupNames && member.groupNames.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {member.groupNames.map((gn, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded bg-emerald-100/70 text-[9px] font-bold text-emerald-800 border border-emerald-200/70"
                      >
                        {gn}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {member.phone && (
                <a
                  href={`https://wa.me/${member.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-1.5 rounded-xl border border-transparent hover:border-slate-200 transition-colors shrink-0 ${colorMap.phoneText}`}
                  title="Hubungi Pengurus via WhatsApp"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 px-3 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40">
          <span className="text-[11px] text-slate-400 font-medium">Dalam Proses Penetapan</span>
        </div>
      )}
    </div>
  );
}
