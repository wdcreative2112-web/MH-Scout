import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { StructureOrgChart } from "@/components/public/StructureOrgChart";
import { Target, Heart, Award, MapPin, Mail, Phone, Building, Network, ArrowRight, Shield } from "lucide-react";

import { mergeStructureWithTemplate } from "@/lib/structure-constants";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  let profile = null;

  try {
    profile = await prisma.organizationProfile.findFirst();
  } catch {
    // DB fallback
  }

  let name = profile?.name || "Gugus Depan MH SCOUT";
  let pangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";

  let parsedStructure: any[] = [];
  if (profile?.structure) {
    try {
      const parsed = JSON.parse(profile.structure);
      if (Array.isArray(parsed)) {
        parsedStructure = parsed;
      }
    } catch {}
  }
  const structure = mergeStructureWithTemplate(parsedStructure);
  const description =
    profile?.description ||
    "MH SCOUT adalah wadah pembinaan kepramukaan yang bertekad membentuk generasi muda Indonesia yang beriman, bertakwa, berakhlak mulia, berjiwa patriotik, taat hukum, disiplin, menjunjung tinggi nilai-nilai luhur bangsa, serta memiliki kecakapan hidup.";
  const history =
    profile?.history ||
    "Gugus Depan ini didirikan dengan tekad untuk menyelenggarakan pendidikan kepramukaan berkualitas. Selama bertahun-tahun, pangkalan ini aktif menyelenggarakan latihan rutin mingguan, perkemahan, kegiatan bakti kemasyarakatan, serta mengantarkan para anggotanya meraih tingkatan Pramuka Garuda.";
  const vision =
    profile?.vision ||
    "Terwujudnya anggota Gerakan Pramuka yang berkarakter unggul, berkepribadian luhur, berwawasan kebangsaan, dan siap menjadi pelopor perubahan positif di masyarakat.";
  const mission =
    profile?.mission ||
    "1. Menyelenggarakan kegiatan kepramukaan yang menarik, menantang, dan edukatif berlandaskan Prinsip Dasar dan Metode Kepramukaan.\n2. Menanamkan nilai-nilai Dasa Darma dan Tri Satya dalam kehidupan sehari-hari.\n3. Meningkatkan kecakapan umum (SKU) dan kecakapan khusus (SKK) anggota.\n4. Mendorong kepedulian sosial dan partisipasi aktif dalam pelestarian lingkungan.";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      {/* 1. Header Banner with Glossy Dark Canvas */}
      <ScrollReveal direction="up" delayMs={50}>
        <div className="relative rounded-3xl lg:rounded-[36px] overflow-hidden bg-gradient-to-b from-[#092218] via-[#0d2a1f] to-[#071912] p-8 sm:p-14 text-white border border-emerald-500/20 shadow-[0_20px_50px_rgba(9,34,24,0.4)]">
          {/* Specular sheen line */}
          <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-10 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 max-w-5xl">
            {/* Official Logo Emblem Container */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2 shadow-2xl shadow-black/40 border border-white/20 shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/logo.jpeg"
                alt="Logo Resmi Gerakan Pramuka Maslahatul Hidayah"
                className="w-full h-full object-contain rounded-2xl"
              />
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 backdrop-blur-md text-xs font-semibold text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Profil & Sejarah Pangkalan</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{name}</h1>
              <p className="text-emerald-300 font-medium text-sm sm:text-lg flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                <span>{pangkalan}</span>
              </p>
              <p className="text-slate-300 text-xs sm:text-base leading-relaxed pt-1 max-w-3xl">
                {description}
              </p>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* 2. Visi dan Misi in Glossy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <ScrollReveal direction="up" delayMs={80} className="h-full">
          <div className="glossy-card rounded-3xl p-6 sm:p-8 space-y-4 border border-white/80 h-full">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shadow-xs">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Visi Organisasi</h2>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-base">{vision}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delayMs={160} className="h-full">
          <div className="glossy-card rounded-3xl p-6 sm:p-8 space-y-4 border border-white/80 h-full">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shadow-xs">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Misi Organisasi</h2>
            <div className="text-slate-600 leading-relaxed text-xs sm:text-base whitespace-pre-line space-y-2">
              {mission}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* 3. Sejarah Singkat in Glossy Panel */}
      <ScrollReveal direction="up" delayMs={100}>
        <div className="glossy-panel rounded-3xl p-6 sm:p-12 border border-white/90 space-y-4 shadow-[0_10px_35px_-10px_rgba(15,36,29,0.05)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Jejak Langkah & Pengabdian</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sejarah Gugus Depan</h2>
          <div className="text-slate-700 leading-relaxed text-xs sm:text-base space-y-3 whitespace-pre-line">
            {history}
          </div>
        </div>
      </ScrollReveal>

      {/* 4. Struktur Kepengurusan Gugus Depan */}
      <div className="space-y-6">
        <ScrollReveal direction="up" delayMs={60}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                <Network className="w-3.5 h-3.5 text-emerald-700" />
                <span>Bagan Organisasi Resmi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                Struktur Kepengurusan
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm mt-1">
                Bagan kepengurusan pangkalan yang mengemban amanah pembinaan kepramukaan.
              </p>
            </div>

            <Link
              href="/struktur"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
            >
              <span>Buka Halaman Struktur Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="up" delayMs={80}>
          <StructureOrgChart sections={structure} />
        </ScrollReveal>
      </div>

      {/* 5. Banner Showcase Regu & Sangga Kepanduan */}
      <ScrollReveal direction="up" delayMs={90}>
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-[#0d2a1f] to-emerald-900 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/30">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Satuan & Perindukan</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              Regu & Sangga Kepanduan
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Lihat seluruh regu penggalang dan perindukan siaga lengkap dengan pembina pendamping, ketua regu (pinru), serta anggota aktif.
            </p>
          </div>

          <Link
            href="/regu"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
          >
            <span>Buka Data Regu & Anggota</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </ScrollReveal>

      {/* 6. Kontak & Sekretariat */}
      <ScrollReveal direction="up" delayMs={100}>
        <div className="glossy-panel rounded-3xl p-6 sm:p-10 border border-white/90 space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>Informasi Sekretariat Pangkalan</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs flex items-start gap-3 hover:bg-white transition-colors">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Alamat</p>
                <p className="text-xs text-slate-500 mt-1">{profile?.address || "Gedung Pembinaan Kepramukaan Pangkalan Sekolah"}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs flex items-start gap-3 hover:bg-white transition-colors">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Telepon & WhatsApp</p>
                <p className="text-xs text-slate-500 mt-1">{profile?.phone || "+62 (021) 555-PRAMUKA"}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs flex items-start gap-3 hover:bg-white transition-colors">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Email Resmi</p>
                <p className="text-xs text-slate-500 mt-1">{profile?.email || "sekretariat@mhscout.id"}</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}
