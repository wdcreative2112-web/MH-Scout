"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveStructureAction } from "@/actions/structure";
import {
  Users,
  Plus,
  Trash2,
  Upload,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Award,
  UserCheck,
  HeartHandshake,
  Image as ImageIcon,
  X,
  Check,
  ChevronDown,
  Layers,
  Building2,
} from "lucide-react";

export interface MemberItem {
  id: string;
  name: string;
  roleTitle?: string;
  nip?: string;
  phone?: string;
  gender?: "L" | "P" | string;
  photo?: string | null;
  groupIds?: string[];
  groupNames?: string[];
}

export interface GroupOption {
  id: string;
  name: string;
  category: string;
}

export interface SectionItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  members: MemberItem[];
}

interface StructureClientViewProps {
  initialStructure: SectionItem[];
  availableLeaders: any[];
  availableGroups: GroupOption[];
  canEdit: boolean;
}

// Client-side image compressor: converts File to compressed Base64 Data URL (max 400px, ~40-60KB)
async function compressImageToBase64(file: File, maxDim = 400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;

        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
    };
    reader.onerror = (err) => reject(err);
  });
}

export function StructureClientView({
  initialStructure,
  availableLeaders,
  availableGroups,
  canEdit,
}: StructureClientViewProps) {
  const router = useRouter();
  const [sections, setSections] = useState<SectionItem[]>(initialStructure);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add a new member to a specific section
  const handleAddMember = (sectionId: string, defaultTitle?: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          const newMember: MemberItem = {
            id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: "",
            roleTitle: defaultTitle || sec.title,
            nip: "",
            phone: "",
            gender: sec.category === "PEMBINA PUTRI" ? "P" : "L",
            photo: null,
            groupIds: [],
            groupNames: [],
          };
          return {
            ...sec,
            members: [...sec.members, newMember],
          };
        }
        return sec;
      })
    );
  };

  // Update a specific member field
  const handleUpdateMember = (
    sectionId: string,
    memberId: string,
    field: keyof MemberItem,
    value: any
  ) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            members: sec.members.map((m) => {
              if (m.id === memberId) {
                return { ...m, [field]: value };
              }
              return m;
            }),
          };
        }
        return sec;
      })
    );
  };

  // Toggle a group assignment for a member
  const handleToggleGroup = (sectionId: string, memberId: string, groupId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            members: sec.members.map((m) => {
              if (m.id === memberId) {
                const current = m.groupIds || [];
                const exists = current.includes(groupId);
                const nextIds = exists
                  ? current.filter((id) => id !== groupId)
                  : [...current, groupId];
                const nextNames = nextIds
                  .map((id) => availableGroups.find((g) => g.id === id)?.name || id)
                  .filter(Boolean);
                return {
                  ...m,
                  groupIds: nextIds,
                  groupNames: nextNames,
                };
              }
              return m;
            }),
          };
        }
        return sec;
      })
    );
  };

  // Remove member from section
  const handleRemoveMember = (sectionId: string, memberId: string) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            members: sec.members.filter((m) => m.id !== memberId),
          };
        }
        return sec;
      })
    );
  };

  // Handle photo upload
  const handlePhotoUpload = async (
    sectionId: string,
    memberId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await compressImageToBase64(file);
      handleUpdateMember(sectionId, memberId, "photo", base64);
    } catch {
      setError("Gagal memproses file foto.");
    }
  };

  // Autofill from existing leader
  const handleAutofillFromLeader = (
    sectionId: string,
    memberId: string,
    leaderId: string
  ) => {
    const leader = availableLeaders.find((l) => l.id === leaderId);
    if (!leader) return;

    const leadGroupIds: string[] = leader.groups?.map((g: any) => g.id) || [];
    const leadGroupNames: string[] = leadGroupIds
      .map((id) => availableGroups.find((g) => g.id === id)?.name || id)
      .filter(Boolean);

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            members: sec.members.map((m) => {
              if (m.id === memberId) {
                return {
                  ...m,
                  name: leader.name || m.name,
                  nip: leader.nip || m.nip,
                  phone: leader.phone || m.phone,
                  photo: leader.photo || m.photo,
                  gender: leader.gender || m.gender,
                  groupIds: leadGroupIds.length > 0 ? leadGroupIds : m.groupIds || [],
                  groupNames: leadGroupNames.length > 0 ? leadGroupNames : m.groupNames || [],
                };
              }
              return m;
            }),
          };
        }
        return sec;
      })
    );
  };

  // Save all structure data to Neon
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await saveStructureAction(sections);
      if (!res.success) {
        setError(res.error || "Gagal menyimpan struktur kepengurusan.");
      } else {
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  // Group sections by category
  const pimpinanSections = sections.filter((s) => s.category === "PIMPINAN");
  const putraSections = sections.filter((s) => s.category === "PEMBINA PUTRA");
  const putriSections = sections.filter((s) => s.category === "PEMBINA PUTRI");
  const pembantuSections = sections.filter((s) => s.category === "PEMBANTU PEMBINA");
  const alumniSections = sections.filter((s) => s.category === "PERWAKILAN ALUMNI");
  const mabigusSections = sections.filter((s) => s.category === "MABIGUS");

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Struktur Kepengurusan & Pembina</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manajemen susunan pengurus dan pembina satuan Gugus Depan lengkap dengan foto & binaan regu. Tersimpan aman di Neon dan tampil otomatis di website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/struktur"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs"
            title="Lihat tampilan bagan resmi di website publik"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Lihat di Website</span>
          </Link>

          {canEdit && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Menyimpan ke Database..." : "Simpan Struktur"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifikasi Status */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Struktur kepengurusan, pembina satuan, foto, dan binaan regu berhasil disimpan ke database Neon!</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. BAGIAN: PIMPINAN INTI GUGUS DEPAN */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Pimpinan Inti Gugus Depan</h2>
            <p className="text-xs text-slate-500">
              Ka. Gudep, Sekretaris, dan Bendahara pangkalan
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {pimpinanSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* 2. BAGIAN: PEMBINA PUTRA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Pembina Satuan Putra</h2>
            <p className="text-xs text-slate-500">
              Koordinator Perindukan Siaga Putra & Pasukan Penggalang Putra beserta penugasan Regu Binaan
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {putraSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* 3. BAGIAN: PEMBINA PUTRI */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-800 flex items-center justify-center font-bold">
            <Award className="w-5 h-5 text-pink-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Pembina Satuan Putri</h2>
            <p className="text-xs text-slate-500">
              Koordinator Perindukan Siaga Putri & Pasukan Penggalang Putri beserta penugasan Regu Binaan
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {putriSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* 4. BAGIAN: PEMBANTU PEMBINA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Pembantu Pembina</h2>
            <p className="text-xs text-slate-500">
              Asisten pembina yang mendampingi kelancaran latihan dan kegiatan rutin
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {pembantuSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* 5. BAGIAN: PERWAKILAN ALUMNI PRAMUKA */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
            <HeartHandshake className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Perwakilan Alumni Pramuka</h2>
            <p className="text-xs text-slate-500">
              Tokoh dan pengurus ikatan alumni yang aktif mendukung gugus depan
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {alumniSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* 6. BAGIAN: MAJELIS PEMBIMBING GUGUS DEPAN (MABIGUS) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5 text-teal-700" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900">Majelis Pembimbing Gugus Depan (Mabigus)</h2>
            <p className="text-xs text-slate-500">
              Ketua Mabigus, Wakil I, Wakil II, Sekretaris, Bendahara, dan Anggota Mabigus
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {mabigusSections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onAddMember={() => handleAddMember(sec.id, sec.title)}
              onUpdateMember={(mId, field, val) => handleUpdateMember(sec.id, mId, field, val)}
              onToggleGroup={(mId, gId) => handleToggleGroup(sec.id, mId, gId)}
              onRemoveMember={(mId) => handleRemoveMember(sec.id, mId)}
              onPhotoUpload={(mId, e) => handlePhotoUpload(sec.id, mId, e)}
              onAutofill={(mId, lId) => handleAutofillFromLeader(sec.id, mId, lId)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Save Bar (Static at bottom of page, no longer floating over forms) */}
      {canEdit && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-slate-900 text-sm">Simpan Seluruh Struktur Organisasi</h4>
            <p className="text-xs text-slate-500">
              Perubahan struktur, foto, dan regu binaan akan otomatis tersimpan ke database dan diperbarui di website.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? "Menyimpan ke Database..." : "Simpan Struktur"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// Sub-komponen per jabatan/kedudukan
function SectionCard({
  section,
  availableLeaders,
  availableGroups,
  canEdit,
  onAddMember,
  onUpdateMember,
  onToggleGroup,
  onRemoveMember,
  onPhotoUpload,
  onAutofill,
}: {
  section: SectionItem;
  availableLeaders: any[];
  availableGroups: GroupOption[];
  canEdit: boolean;
  onAddMember: () => void;
  onUpdateMember: (mId: string, field: keyof MemberItem, val: any) => void;
  onToggleGroup: (mId: string, groupId: string) => void;
  onRemoveMember: (mId: string) => void;
  onPhotoUpload: (mId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutofill: (mId: string, leaderId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{section.title}</h3>
            <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
              {section.members.length} Personel
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{section.subtitle}</p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Tambah Anggota</span>
          </button>
        )}
      </div>

      {section.members.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {section.members.map((member, idx) => (
            <MemberCard
              key={member.id}
              member={member}
              index={idx}
              section={section}
              availableLeaders={availableLeaders}
              availableGroups={availableGroups}
              canEdit={canEdit}
              onUpdateMember={(field, val) => onUpdateMember(member.id, field, val)}
              onToggleGroup={(gId) => onToggleGroup(member.id, gId)}
              onRemoveMember={() => onRemoveMember(member.id)}
              onPhotoUpload={(e) => onPhotoUpload(member.id, e)}
              onAutofill={(lId) => onAutofill(member.id, lId)}
            />
          ))}
        </div>
      ) : (
        <div className="py-5 text-center bg-white rounded-xl border border-dashed border-slate-200">
          <p className="text-xs text-slate-400">Belum ada pengurus di kedudukan ini.</p>
          {canEdit && (
            <button
              type="button"
              onClick={onAddMember}
              className="mt-1.5 text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pengurus</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Sub-komponen per Personel Pengurus / Pembina
function MemberCard({
  member,
  index,
  section,
  availableLeaders,
  availableGroups,
  canEdit,
  onUpdateMember,
  onToggleGroup,
  onRemoveMember,
  onPhotoUpload,
  onAutofill,
}: {
  member: MemberItem;
  index: number;
  section: SectionItem;
  availableLeaders: any[];
  availableGroups: GroupOption[];
  canEdit: boolean;
  onUpdateMember: (field: keyof MemberItem, val: any) => void;
  onToggleGroup: (groupId: string) => void;
  onRemoveMember: () => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutofill: (leaderId: string) => void;
}) {
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  const selectedGroupIds = member.groupIds || [];
  const isPembinaOrCoaching =
    section.category.includes("PEMBINA") ||
    section.category.includes("PEMBANTU") ||
    section.title.toLowerCase().includes("koordinator") ||
    section.title.toLowerCase().includes("pembina");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-2xs relative">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Personel #{index + 1} &bull; {section.title}
        </span>

        {canEdit && (
          <button
            type="button"
            onClick={onRemoveMember}
            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
            title="Hapus personel ini"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Foto & Detail Pengurus */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        {/* Frame Foto */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center shadow-xs shrink-0">
            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name || "Foto Pengurus"}
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <div className="text-center p-1">
                <ImageIcon className="w-6 h-6 text-slate-300 mx-auto" />
                <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                  Foto
                </span>
              </div>
            )}

            {canEdit && (
              <label className="absolute inset-0 bg-slate-950/40 opacity-0 hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white text-[10px] font-bold gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <label className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold cursor-pointer">
                <Upload className="w-3 h-3" />
                <span>{member.photo ? "Ganti" : "Upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onPhotoUpload}
                  className="hidden"
                />
              </label>

              {member.photo && (
                <button
                  type="button"
                  onClick={() => onUpdateMember("photo", null)}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold hover:underline flex items-center gap-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Field Input Nama & Jabatan */}
        <div className="flex-1 w-full space-y-2.5 min-w-0">
          {canEdit && availableLeaders.length > 0 && (
            <div>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    onAutofill(e.target.value);
                  }
                }}
                defaultValue=""
                className="w-full px-2 py-1 text-[11px] rounded-lg border border-slate-200 bg-slate-50 text-slate-600 focus:outline-hidden"
              >
                <option value="">-- Isi Cepat dari Data Pembina --</option>
                {availableLeaders.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.position})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">
              Nama Lengkap *
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={member.name}
              onChange={(e) => onUpdateMember("name", e.target.value)}
              placeholder="Contoh: Kak Budi Santoso, S.Pd"
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 font-semibold text-slate-900 bg-white disabled:bg-slate-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Keterangan Jabatan
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={member.roleTitle || ""}
                onChange={(e) => onUpdateMember("roleTitle", e.target.value)}
                placeholder={`Contoh: ${section.title}`}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-slate-700 bg-white disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                Jenis Kelamin
              </label>
              <select
                disabled={!canEdit}
                value={member.gender || "L"}
                onChange={(e) => onUpdateMember("gender", e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-slate-700 bg-white disabled:bg-slate-50"
              >
                <option value="L">Putra (Laki-laki)</option>
                <option value="P">Putri (Perempuan)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                NTA / NIP
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={member.nip || ""}
                onChange={(e) => onUpdateMember("nip", e.target.value)}
                placeholder="01.001.xxx"
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-slate-700 bg-white disabled:bg-slate-50 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">
                No. WhatsApp
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={member.phone || ""}
                onChange={(e) => onUpdateMember("phone", e.target.value)}
                placeholder="0812xxxx"
                className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-slate-700 bg-white disabled:bg-slate-50 text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Regu / Sangga Binaan Selector (Terintegrasi Penuh) */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-600 uppercase">
              Regu Binaan:
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md">
              {selectedGroupIds.length} Regu
            </span>
          </div>

          {canEdit && availableGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setShowGroupSelector((prev) => !prev)}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              <span>{showGroupSelector ? "Tutup Pilihan" : "+ Atur Regu Binaan"}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showGroupSelector ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>

        {/* Selected Groups Badges */}
        {selectedGroupIds.length > 0 ? (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {selectedGroupIds.map((gId) => {
              const grp = availableGroups.find((g) => g.id === gId);
              const groupName = grp?.name || gId;
              return (
                <span
                  key={gId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-200/80 shadow-2xs"
                >
                  <span>{groupName}</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onToggleGroup(gId)}
                      className="text-emerald-700 hover:text-rose-600 p-0.5 rounded-xs"
                      title="Lepas binaan regu ini"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        ) : (
          !showGroupSelector && (
            <p className="text-[11px] text-slate-400 italic mt-1">
              {isPembinaOrCoaching
                ? "Belum ada regu binaan yang ditugaskan."
                : "Tidak membina regu secara khusus."}
            </p>
          )
        )}

        {/* Dropdown Checklist of Available Groups */}
        {canEdit && showGroupSelector && (
          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
              <span>Pilih Regu / Sangga yang Dibina:</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Centang untuk menugaskan
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1">
              {availableGroups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => onToggleGroup(group.id)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-left text-xs transition-colors border cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="min-w-0 pr-1">
                      <p className="truncate text-[11px]">{group.name}</p>
                      <span
                        className={`text-[9px] block truncate ${
                          isSelected ? "text-emerald-100" : "text-slate-400"
                        }`}
                      >
                        {group.category}
                      </span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
