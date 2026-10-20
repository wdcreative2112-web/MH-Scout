"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  Users,
  Award,
  Crown,
  Search,
  X,
  ChevronRight,
  Sparkles,
  ArrowLeft,
  Building,
  GraduationCap,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { ScrollReveal } from "@/components/public/ScrollReveal";

export interface MemberSummary {
  id: string;
  fullName: string;
  memberNumber: string;
  gender: string;
  scoutLevel: string;
  classGrade?: string | null;
  avatar?: string | null;
}

export interface LeaderSummary {
  id: string;
  name: string;
  position?: string | null;
  photo?: string | null;
  phone?: string | null;
  nip?: string | null;
}

export interface PinruSummary {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface PublicGroupItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  leader?: LeaderSummary | null;
  users?: PinruSummary[];
  members: MemberSummary[];
  _count?: {
    members: number;
  };
}

interface PublicGroupsViewProps {
  groups: PublicGroupItem[];
  orgName: string;
  pangkalan: string;
}

export function PublicGroupsView({
  groups,
  orgName,
  pangkalan,
}: PublicGroupsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalGroup, setActiveModalGroup] = useState<PublicGroupItem | null>(null);
  const [modalSearch, setModalSearch] = useState("");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    groups.forEach((g) => {
      if (g.category) set.add(g.category);
    });
    return Array.from(set);
  }, [groups]);

  // Overall Statistics
  const totalGroups = groups.length;
  const totalMembers = useMemo(() => {
    return groups.reduce((acc, g) => acc + (g.members?.length || 0), 0);
  }, [groups]);

  const totalPembinaAssigned = useMemo(() => {
    const leaderIds = new Set<string>();
    groups.forEach((g) => {
      if (g.leader?.id) leaderIds.add(g.leader.id);
    });
    return leaderIds.size;
  }, [groups]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchCat =
        selectedCategory === "ALL" ||
        g.category.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchCat) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchName = g.name.toLowerCase().includes(q);
      const matchCategory = g.category.toLowerCase().includes(q);
      const matchLeader = g.leader?.name?.toLowerCase().includes(q);
      const matchPinru = g.users?.some((u) => u.name.toLowerCase().includes(q));
      const matchMember = g.members?.some((m) =>
        m.fullName.toLowerCase().includes(q)
      );

      return matchName || matchCategory || matchLeader || matchPinru || matchMember;
    });
  }, [groups, selectedCategory, searchQuery]);

  // Modal filtered members
  const modalMembers = useMemo(() => {
    if (!activeModalGroup) return [];
    if (!modalSearch.trim()) return activeModalGroup.members;
    const q = modalSearch.toLowerCase();
    return activeModalGroup.members.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.memberNumber.toLowerCase().includes(q) ||
        m.scoutLevel.toLowerCase().includes(q)
    );
  }, [activeModalGroup, modalSearch]);

  const getCategoryTheme = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("putri")) {
      return {
        badge: "bg-pink-50 text-pink-700 border-pink-200",
        iconBg: "bg-pink-100 text-pink-700",
        borderAccent: "hover:border-pink-300",
        pill: "bg-pink-500",
      };
    }
    if (cat.includes("putra")) {
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-200",
        iconBg: "bg-blue-100 text-blue-700",
        borderAccent: "hover:border-blue-300",
        pill: "bg-blue-500",
      };
    }
    if (cat.includes("siaga")) {
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        iconBg: "bg-amber-100 text-amber-700",
        borderAccent: "hover:border-amber-300",
        pill: "bg-amber-500",
      };
    }
    return {
      badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700",
      borderAccent: "hover:border-emerald-300",
      pill: "bg-emerald-600",
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 sm:space-y-12">
      {/* 1. HERO BANNER */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="relative rounded-3xl lg:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071912] p-8 sm:p-12 text-white border border-emerald-500/20 shadow-[0_20px_50px_rgba(9,34,24,0.4)]">
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md text-xs font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Satuan & Perindukan Pangkalan</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Regu & Sangga Kepanduan
            </h1>

            <p className="text-emerald-300 font-medium text-sm sm:text-base flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{orgName} — {pangkalan}</span>
            </p>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl pt-1">
              Daftar regu penggalang dan perindukan siaga yang aktif berproses dalam pembinaan karakter. Lengkap dengan pembina pendamping, pemimpin regu (pinru), dan adik-adik anggota aktif.
            </p>

            {/* Quick Stats Badges */}
            <div className="pt-3 flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">
                  {totalGroups} Regu / Sangga
                </span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-white">
                  {totalMembers} Anggota Aktif
                </span>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center gap-2.5">
                <Award className="w-4 h-4 text-blue-300" />
                <span className="text-xs font-bold text-white">
                  {totalPembinaAssigned} Pembina Pendamping
                </span>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. FILTER & SEARCH CONTROLS */}
      <ScrollReveal direction="up" delayMs={80}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white/70 p-3 sm:p-4 rounded-3xl border border-slate-200/80 backdrop-blur-md shadow-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Semua ({totalGroups})
            </button>
            {categories.map((cat) => {
              const count = groups.filter((g) => g.category === cat).length;
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari regu, pembina, anggota..."
              className="w-full pl-10 pr-9 py-2 text-xs rounded-2xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* 3. GROUP CARDS GRID */}
      <div className="space-y-6">
        {filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredGroups.map((group, idx) => {
              const theme = getCategoryTheme(group.category);
              const pinru = group.users?.[0]?.name;
              const memberCount = group.members?.length || 0;

              return (
                <ScrollReveal
                  key={group.id}
                  direction="up"
                  delayMs={(idx % 6) * 60 + 60}
                >
                  <div
                    className={`glossy-card rounded-3xl p-5 sm:p-6 border border-white/90 hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-5 h-full ${theme.borderAccent}`}
                  >
                    {/* Top Regu Meta */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center font-black text-lg shadow-xs shrink-0`}
                          >
                            <Shield className="w-6 h-6" />
                          </div>
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${theme.badge}`}
                            >
                              {group.category}
                            </span>
                            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight mt-0.5">
                              {group.name}
                            </h3>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold shrink-0 border border-slate-200">
                          {memberCount} Anggota
                        </span>
                      </div>

                      {group.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {group.description}
                        </p>
                      )}
                    </div>

                    {/* Middle Section: Pembina & Pinru */}
                    <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 space-y-2.5 text-xs">
                      {/* Pembina Pendamping */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Pembina:</span>
                        </span>
                        <div className="text-right truncate">
                          {group.leader ? (
                            <span className="font-bold text-slate-800 text-xs truncate">
                              {group.leader.name}
                            </span>
                          ) : (
                            <span className="italic text-slate-400 text-[11px]">
                              Belum ditentukan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ketua Regu (PINRU) */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/50">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Pemimpin (PINRU):</span>
                        </span>
                        <div className="text-right truncate">
                          {pinru ? (
                            <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/70 text-[11px] truncate">
                              {pinru}
                            </span>
                          ) : (
                            <span className="italic text-slate-400 text-[11px]">
                              Belum ditunjuk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Anggota Preview & Modal Trigger */}
                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                      {/* Avatar preview */}
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {group.members.slice(0, 4).map((mem, i) => (
                          <div
                            key={mem.id || i}
                            title={mem.fullName}
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center overflow-hidden"
                          >
                            {mem.avatar ? (
                              <img
                                src={mem.avatar}
                                alt={mem.fullName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              mem.fullName.charAt(0)
                            )}
                          </div>
                        ))}
                        {memberCount > 4 && (
                          <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center">
                            +{memberCount - 4}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalGroup(group);
                          setModalSearch("");
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Lihat Anggota</span>
                        <ChevronRight className="w-3 h-3 text-emerald-500" />
                      </button>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <Shield className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">
              Tidak Ada Regu yang Sesuai
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ditemukan data regu dengan filter atau kata kunci pencarian yang dimasukkan.
            </p>
            {(selectedCategory !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. MODAL: LIHAT SEMUA ANGGOTA AKTIF REGU */}
      {activeModalGroup && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150 relative">
              {/* Header Modal */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                    <Shield className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {activeModalGroup.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {activeModalGroup.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1">
                      <span>
                        Pembina:{" "}
                        <strong className="text-slate-700">
                          {activeModalGroup.leader?.name || "Belum ditentukan"}
                        </strong>
                      </span>
                      {activeModalGroup.users?.[0]?.name && (
                        <span>
                          PINRU:{" "}
                          <strong className="text-amber-800">
                            {activeModalGroup.users[0].name}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalGroup(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Inside Modal */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder={`Cari dari ${activeModalGroup.members.length} anggota regu...`}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Member List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {modalMembers.length > 0 ? (
                  modalMembers.map((member, idx) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                          {member.avatar ? (
                            <img
                              src={member.avatar}
                              alt={member.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            member.fullName.charAt(0)
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {member.fullName}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                            <span className="font-mono">NTA: {member.memberNumber}</span>
                            {member.classGrade && (
                              <span>&bull; {member.classGrade}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                          {member.scoutLevel || "Anggota"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ditemukan anggota dengan nama tersebut.
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Total: <strong>{activeModalGroup.members.length}</strong> anggota aktif
                </span>
                <button
                  type="button"
                  onClick={() => setActiveModalGroup(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. FOOTER NAVIGATION */}
      <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Lihat Halaman Profil & Sejarah</span>
        </Link>

        <Link
          href="/struktur"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-700 hover:underline"
        >
          <span>Bagan Struktur Kepengurusan</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
