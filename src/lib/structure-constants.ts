export interface StructureMember {
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

export interface StructureSection {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  members: StructureMember[];
}

export const DEFAULT_STRUCTURE_TEMPLATE: StructureSection[] = [
  {
    id: "sec-gudep",
    category: "PIMPINAN",
    title: "Ka. Gudep",
    subtitle: "Ketua Gugus Depan",
    members: [],
  },
  {
    id: "sec-sekretaris",
    category: "PIMPINAN",
    title: "Sekretaris",
    subtitle: "Administrasi & Kesekretariatan",
    members: [],
  },
  {
    id: "sec-bendahara",
    category: "PIMPINAN",
    title: "Bendahara",
    subtitle: "Keuangan & Aset Pangkalan",
    members: [],
  },
  {
    id: "sec-putra-siaga",
    category: "PEMBINA PUTRA",
    title: "Koordinator Siaga",
    subtitle: "Pembinaan Satuan Siaga Putra",
    members: [],
  },
  {
    id: "sec-putra-penggalang",
    category: "PEMBINA PUTRA",
    title: "Koordinator Penggalang",
    subtitle: "Pembinaan Satuan Penggalang Putra",
    members: [],
  },
  {
    id: "sec-putri-siaga",
    category: "PEMBINA PUTRI",
    title: "Koordinator Siaga",
    subtitle: "Pembinaan Satuan Siaga Putri",
    members: [],
  },
  {
    id: "sec-putri-penggalang",
    category: "PEMBINA PUTRI",
    title: "Koordinator Penggalang",
    subtitle: "Pembinaan Satuan Penggalang Putri",
    members: [],
  },
  {
    id: "sec-pembantu",
    category: "PEMBANTU PEMBINA",
    title: "Pembantu Pembina",
    subtitle: "Dukungan Teknis & Lapangan",
    members: [],
  },
  {
    id: "sec-alumni",
    category: "PERWAKILAN ALUMNI",
    title: "Perwakilan Alumni Pramuka",
    subtitle: "Dukungan Kemitraan & Paguyuban Alumni",
    members: [],
  },
  // MAJELIS PEMBIMBING GUGUS DEPAN (MABIGUS) - Posisi di bawah
  {
    id: "sec-mabigus-ketua",
    category: "MABIGUS",
    title: "Ketua Mabigus",
    subtitle: "Ketua Majelis Pembimbing Gugus Depan",
    members: [],
  },
  {
    id: "sec-mabigus-wakil-1",
    category: "MABIGUS",
    title: "Wakil I",
    subtitle: "Wakil Ketua I Mabigus",
    members: [],
  },
  {
    id: "sec-mabigus-wakil-2",
    category: "MABIGUS",
    title: "Wakil II",
    subtitle: "Wakil Ketua II Mabigus",
    members: [],
  },
  {
    id: "sec-mabigus-sekretaris",
    category: "MABIGUS",
    title: "Sekretaris",
    subtitle: "Sekretaris Mabigus",
    members: [],
  },
  {
    id: "sec-mabigus-bendahara",
    category: "MABIGUS",
    title: "Bendahara",
    subtitle: "Bendahara Mabigus",
    members: [],
  },
  {
    id: "sec-mabigus-anggota",
    category: "MABIGUS",
    title: "Anggota",
    subtitle: "Anggota Majelis Pembimbing",
    members: [],
  },
];

export function mergeStructureWithTemplate(savedSections: any[] | null | undefined): StructureSection[] {
  if (!Array.isArray(savedSections) || savedSections.length === 0) {
    return JSON.parse(JSON.stringify(DEFAULT_STRUCTURE_TEMPLATE));
  }

  const savedMap = new Map<string, any>(savedSections.map((s: any) => [s.id, s]));

  // Auto-migrate legacy sec-mabigus to sec-mabigus-ketua if present
  if (savedMap.has("sec-mabigus") && !savedMap.has("sec-mabigus-ketua")) {
    const oldMabigus = savedMap.get("sec-mabigus");
    savedMap.set("sec-mabigus-ketua", { ...oldMabigus, id: "sec-mabigus-ketua" });
  }

  return DEFAULT_STRUCTURE_TEMPLATE.map((tpl) => {
    const existing = savedMap.get(tpl.id);
    if (existing) {
      return {
        ...tpl,
        ...existing,
        category: tpl.category,
        title: tpl.title,
        subtitle: tpl.subtitle,
        members: Array.isArray(existing.members) ? existing.members : [],
      };
    }
    return { ...tpl, members: [] };
  });
}
