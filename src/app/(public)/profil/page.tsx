import React from "react";
import { prisma } from "@/lib/prisma";
import { ScrollReveal } from "@/components/public/ScrollReveal";
import { ShieldCheck, Target, Heart, Award, Users, MapPin, Mail, Phone, Building, UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  let profile = null;
  let leaders: any[] = [];

  try {
    profile = await prisma.organizationProfile.findFirst();
    leaders = await prisma.leader.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    });
  } catch {
    // DB fallback
  }

  const name = profile?.name || "Gugus Depan MH SCOUT";
  const pangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";
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

      {/* 4. Pembina Gugus Depan with Glossy Profile Cards */}
      <div className="space-y-6">
        <ScrollReveal direction="up" delayMs={60}>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-900 border border-emerald-200">
              <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Majelis Pembimbing & Pembina</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">Pembina Satuan</h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1">
              Para pembina berdedikasi yang membimbing dan mendampingi adik-adik pramuka dalam setiap proses pembinaan.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {leaders.length > 0 ? (
            leaders.map((leader, idx) => (
              <ScrollReveal key={leader.id} direction="up" delayMs={idx * 100 + 80}>
                <div
                  className="glossy-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 group hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-black text-xl shadow-xs overflow-hidden">
                    {leader.photo ? (
                      <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      leader.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{leader.name}</h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5 truncate">{leader.position}</p>
                    {leader.nip && (
                      <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1.5 border border-slate-200">
                        NTA: {leader.nip}
                      </span>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))
          ) : (
            [
              { name: "Kak Budi Santoso, S.Pd", role: "Ketua Gugus Depan (Ka Gudep)", nta: "01.001.001" },
              { name: "Kak Siti Rahmawati, S.Pd", role: "Pembina Satuan Putri", nta: "01.002.002" },
              { name: "Kak Hendra Wijaya", role: "Pembina Satuan Putra", nta: "01.001.003" },
            ].map((lead, idx) => (
              <ScrollReveal key={idx} direction="up" delayMs={idx * 100 + 80}>
                <div
                  className="glossy-card rounded-2xl p-5 sm:p-6 flex items-center gap-4 group hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-lg shadow-xs">
                    <Users className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">{lead.name}</h3>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5 truncate">{lead.role}</p>
                    <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1.5 border border-slate-200">
                      NTA: {lead.nta}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))
          )}
        </div>
      </div>

      {/* 5. Kontak & Sekretariat */}
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
