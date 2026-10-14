import React from "react";
import { prisma } from "@/lib/prisma";
import { Compass, ShieldCheck, Target, Heart, Award, Users, MapPin, Mail, Phone } from "lucide-react";

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

  const name = profile?.name || "Gugus Depan PramukaOne";
  const pangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";
  const description =
    profile?.description ||
    "PramukaOne adalah wadah pembinaan kepramukaan yang bertekad membentuk generasi muda Indonesia yang beriman, bertakwa, berakhlak mulia, berjiwa patriotik, taat hukum, disiplin, menjunjung tinggi nilai-nilai luhur bangsa, serta memiliki kecakapan hidup.";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-scout-950 via-scout-900 to-scout-800 rounded-3xl p-8 sm:p-14 text-white space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-scout-800 border border-scout-700 text-xs font-semibold text-emerald-300">
          <Compass className="w-4 h-4 text-amber-300" />
          <span>Profil & Sejarah Organisasi</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{name}</h1>
        <p className="text-emerald-300 font-medium text-base sm:text-lg">{pangkalan}</p>
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl pt-2">
          {description}
        </p>
      </div>

      {/* Visi dan Misi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Visi Organisasi</h2>
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{vision}</p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Award className="w-6 h-6 text-amber-700" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Misi Organisasi</h2>
          <div className="text-slate-600 leading-relaxed text-sm sm:text-base whitespace-pre-line">
            {mission}
          </div>
        </div>
      </div>

      {/* Sejarah Singkat */}
      <div className="bg-scout-50/60 rounded-3xl p-8 sm:p-12 border border-scout-200/80 space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-scout-800 uppercase tracking-wider">
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Jejak Langkah & Pengabdian</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Sejarah Gugus Depan</h2>
        <div className="text-slate-700 leading-relaxed text-sm sm:text-base space-y-3 whitespace-pre-line">
          {history}
        </div>
      </div>

      {/* Pembina Gugus Depan */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-scout-700">Majelis Pembimbing & Pembina</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Pembina Satuan</h2>
          <p className="text-slate-600 text-sm mt-1">
            Para pembina berdedikasi yang membimbing dan mendampingi adik-adik pramuka dalam setiap proses pembinaan.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {leaders.length > 0 ? (
            leaders.map((leader) => (
              <div
                key={leader.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-scout-100 text-scout-800 flex items-center justify-center shrink-0 font-black text-xl">
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    leader.name.charAt(0)
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{leader.name}</h3>
                  <p className="text-xs font-semibold text-scout-700">{leader.position}</p>
                  {leader.nip && <p className="text-[11px] text-slate-500 mt-0.5">NTA: {leader.nip}</p>}
                </div>
              </div>
            ))
          ) : (
            [
              { name: "Kak Budi Santoso, S.Pd", role: "Ketua Gugus Depan (Ka Gudep)", nta: "01.001.001" },
              { name: "Kak Siti Rahmawati, S.Pd", role: "Pembina Satuan Putri", nta: "01.002.002" },
              { name: "Kak Hendra Wijaya", role: "Pembina Satuan Putra", nta: "01.001.003" },
            ].map((lead, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-scout-100 text-scout-800 flex items-center justify-center shrink-0 font-bold text-lg">
                  <Users className="w-6 h-6 text-scout-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{lead.name}</h3>
                  <p className="text-xs font-semibold text-scout-700">{lead.role}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">NTA: {lead.nta}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Kontak & Sekretariat */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Informasi Sekretariat</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Alamat</p>
              <p className="text-xs mt-1">{profile?.address || "Gedung Pembinaan Kepramukaan Pangkalan Sekolah"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Telepon / WhatsApp</p>
              <p className="text-xs mt-1">{profile?.phone || "+62 (021) 555-PRAMUKA"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">Email Resmi</p>
              <p className="text-xs mt-1">{profile?.email || "sekretariat@pramukaone.id"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
