import { formatDate, formatDayDate } from "./utils";
import { getBaseUrl } from "./share";

export interface PermitLetterData {
  id?: string;
  letterNumber: string;
  date: string;
  memberId?: string;
  memberName: string;
  memberNumber: string;
  groupName: string;
  scoutLevel: string;
  classGrade?: string;
  activityId?: string;
  activityTitle: string;
  permitType: "SAKIT" | "IZIN";
  startDate: string;
  endDate: string;
  reason: string;
  parentName: string;
  parentPhone?: string;
  leaderName: string;
  leaderNip?: string;
  createdPlace: string;
  notes?: string;
}

/**
 * Generates an official scout permit letter number:
 * Format: [NomorUrut]/GUD-MH/IZIN/[BulanRomawi]/[Tahun]
 */
export function generatePermitLetterNumber(
  counter: number,
  date: Date = new Date()
): string {
  const romanMonths = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  const monthRoman = romanMonths[date.getMonth()];
  const year = date.getFullYear();
  const padNum = String(counter + 1).padStart(3, "0");
  return `${padNum}/GUD-MH/IZIN/${monthRoman}/${year}`;
}

/**
 * Parses structured permit letter metadata from letter.notes JSON string,
 * or returns null if it's a regular letter.
 */
export function parsePermitLetter(letter: any): PermitLetterData | null {
  if (!letter || !letter.notes) return null;
  try {
    const parsed = JSON.parse(letter.notes);
    if (parsed && (parsed.isPermitLetter || parsed.permitType)) {
      return {
        id: letter.id,
        letterNumber: letter.letterNumber,
        date: letter.date ? new Date(letter.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        memberId: parsed.memberId || "",
        memberName: parsed.memberName || letter.recipient || "",
        memberNumber: parsed.memberNumber || "-",
        groupName: parsed.groupName || "-",
        scoutLevel: parsed.scoutLevel || "Penggalang",
        classGrade: parsed.classGrade || "",
        activityId: parsed.activityId || "",
        activityTitle: parsed.activityTitle || "Latihan Rutin Pramuka",
        permitType: parsed.permitType || "IZIN",
        startDate: parsed.startDate || (letter.date ? new Date(letter.date).toISOString().split("T")[0] : ""),
        endDate: parsed.endDate || parsed.startDate || "",
        reason: parsed.reason || letter.summary || "-",
        parentName: parsed.parentName || (letter.sender ? letter.sender.replace(/^Orang Tua \/ Wali \((.*)\)$/, "$1") : "-"),
        parentPhone: parsed.parentPhone || "",
        leaderName: parsed.leaderName || "Pembina Gugus Depan",
        leaderNip: parsed.leaderNip || "-",
        createdPlace: parsed.createdPlace || "Jakarta",
        notes: parsed.notes || "",
      };
    }
  } catch {
    // If notes is not JSON, check subject
    if (letter.subject && letter.subject.toLowerCase().includes("surat izin")) {
      return {
        id: letter.id,
        letterNumber: letter.letterNumber,
        date: letter.date ? new Date(letter.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        memberName: letter.subject.replace(/.*- (.*)/, "$1").trim() || "Anggota Pramuka",
        memberNumber: "-",
        groupName: "-",
        scoutLevel: "Penggalang",
        activityTitle: "Kegiatan Pramuka",
        permitType: letter.subject.toLowerCase().includes("sakit") ? "SAKIT" : "IZIN",
        startDate: letter.date ? new Date(letter.date).toISOString().split("T")[0] : "",
        endDate: letter.date ? new Date(letter.date).toISOString().split("T")[0] : "",
        reason: letter.summary || "-",
        parentName: letter.sender || "Orang Tua / Wali",
        leaderName: "Pembina Gugus Depan",
        createdPlace: "Jakarta",
      };
    }
  }
  return null;
}

/**
 * Formats a clean WhatsApp message for sending the permit letter.
 */
export function formatPermitWhatsAppMessage(
  data: PermitLetterData,
  printUrl?: string
): string {
  const isSakit = data.permitType === "SAKIT";
  const dateRange =
    data.startDate === data.endDate || !data.endDate
      ? formatDate(data.startDate)
      : `${formatDate(data.startDate)} s.d. ${formatDate(data.endDate)}`;

  const lines: string[] = [
    `*📄 SURAT PERMOHONAN IZIN TIDAK HADIR KEGIATAN PRAMUKA*`,
    `*Gugus Depan MH SCOUT*`,
    `No: ${data.letterNumber}`,
    ``,
    `Kepada Yth. Kakak Pembina Gugus Depan,`,
    `Dengan ini kami menyampaikan surat permohonan izin untuk anggota:`,
    ``,
    `👤 *Nama:* ${data.memberName}`,
    `🆔 *NTA:* ${data.memberNumber || "-"}`,
    `🏕️ *Regu/Tingkat:* ${data.groupName || "-"} (${data.scoutLevel || "Penggalang"})`,
    data.classGrade ? `🏫 *Kelas:* ${data.classGrade}` : "",
    ``,
    `📌 *Kegiatan:* ${data.activityTitle}`,
    `📅 *Waktu:* ${dateRange}`,
    `⚠️ *Keterangan:* ${isSakit ? "🔴 SAKIT" : "🟡 IZIN"}`,
    `💬 *Alasan:* "${data.reason}"`,
    ``,
    `✍️ *Pemohon (Orang Tua/Wali):* ${data.parentName}`,
    `🎖️ *Mengetahui Pembina:* ${data.leaderName}`,
  ];

  if (printUrl) {
    lines.push(``);
    lines.push(`📄 *Lihat & Unduh Dokumen PDF Resmi:*`);
    lines.push(printUrl);
  }

  lines.push(``);
  lines.push(`_Demikian permohonan izin ini kami sampaikan. Terima kasih. Salam Pramuka!_`);

  return lines.filter(Boolean).join("\n");
}

/**
 * Generates the direct WhatsApp share URL.
 */
export function getPermitWhatsAppShareUrl(
  data: PermitLetterData,
  printUrl?: string
): string {
  const text = formatPermitWhatsAppMessage(data, printUrl);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
