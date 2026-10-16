"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { letterSchema } from "@/lib/validations/content";

export async function createLetterAction(formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    letterNumber: formData.get("letterNumber") as string,
    type: formData.get("type") as "MASUK" | "KELUAR",
    date: formData.get("date") as string,
    subject: formData.get("subject") as string,
    sender: (formData.get("sender") as string) || null,
    recipient: (formData.get("recipient") as string) || null,
    summary: (formData.get("summary") as string) || null,
    status: (formData.get("status") as any) || "DRAF",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = letterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const letter = await prisma.letter.create({
      data: {
        letterNumber: parsed.data.letterNumber,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        subject: parsed.data.subject,
        sender: parsed.data.sender,
        recipient: parsed.data.recipient,
        summary: parsed.data.summary,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch {
    return { success: false, error: "Gagal menyimpan data surat." };
  }
}

export async function updateLetterAction(id: string, formData: FormData) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  const raw = {
    letterNumber: formData.get("letterNumber") as string,
    type: formData.get("type") as "MASUK" | "KELUAR",
    date: formData.get("date") as string,
    subject: formData.get("subject") as string,
    sender: (formData.get("sender") as string) || null,
    recipient: (formData.get("recipient") as string) || null,
    summary: (formData.get("summary") as string) || null,
    status: (formData.get("status") as any) || "DRAF",
    notes: (formData.get("notes") as string) || null,
  };

  const parsed = letterSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message };
  }

  try {
    const letter = await prisma.letter.update({
      where: { id },
      data: {
        letterNumber: parsed.data.letterNumber,
        type: parsed.data.type,
        date: new Date(parsed.data.date),
        subject: parsed.data.subject,
        sender: parsed.data.sender,
        recipient: parsed.data.recipient,
        summary: parsed.data.summary,
        status: parsed.data.status,
        notes: parsed.data.notes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_SURAT",
        module: "SURAT",
        details: `Mengubah arsip surat: ${letter.letterNumber} - ${letter.subject}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch {
    return { success: false, error: "Gagal memperbarui data surat." };
  }
}

export async function deleteLetterAction(id: string) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak." };
  }

  try {
    const letter = await prisma.letter.findUnique({
      where: { id },
      select: { id: true, letterNumber: true, subject: true },
    });

    if (!letter) {
      return { success: false, error: "Surat tidak ditemukan." };
    }

    await prisma.letter.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "HAPUS_SURAT",
        module: "SURAT",
        details: `Menghapus arsip surat: ${letter.letterNumber} - ${letter.subject}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true };
  } catch (err: any) {
    console.error("Delete letter error:", err);
    return { success: false, error: "Gagal menghapus data surat." };
  }
}

export async function createPermitLetterAction(formData: FormData) {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS" && session.role !== "KETUA_REGU") {
    return { success: false, error: "Akses ditolak: Anda tidak memiliki wewenang mengelola surat izin." };
  }

  const memberId = (formData.get("memberId") as string) || "";

  // Jika KETUA_REGU, verifikasi bahwa anggota termasuk dalam regunya
  if (session.role === "KETUA_REGU") {
    if (!session.groupId) {
      return { success: false, error: "Akses ditolak: Akun Ketua Regu belum terhubung ke regu manapun." };
    }
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId },
        select: { groupId: true },
      });
      if (!member || member.groupId !== session.groupId) {
        return { success: false, error: "Akses ditolak: Anda hanya dapat membuat surat izin untuk anggota regu Anda." };
      }
    }
  }

  const letterNumber = (formData.get("letterNumber") as string)?.trim();
  const dateStr = (formData.get("date") as string) || new Date().toISOString();
  const memberName = (formData.get("memberName") as string)?.trim();
  const memberNumber = (formData.get("memberNumber") as string)?.trim() || "-";
  const groupName = (formData.get("groupName") as string)?.trim() || "-";
  const scoutLevel = (formData.get("scoutLevel") as string)?.trim() || "Penggalang";
  const classGrade = (formData.get("classGrade") as string)?.trim() || "";
  const activityTitle = (formData.get("activityTitle") as string)?.trim() || "Kegiatan Pramuka";
  const permitType = (formData.get("permitType") as string) === "SAKIT" ? "SAKIT" : "IZIN";
  const startDate = (formData.get("startDate") as string) || dateStr.split("T")[0];
  const endDate = (formData.get("endDate") as string) || startDate;
  const reason = (formData.get("reason") as string)?.trim() || "Berhalangan hadir";
  const parentName = (formData.get("parentName") as string)?.trim() || "Orang Tua / Wali";
  const parentPhone = (formData.get("parentPhone") as string)?.trim() || "";
  const leaderName = (formData.get("leaderName") as string)?.trim() || "Pembina Satuan";
  const leaderNip = (formData.get("leaderNip") as string)?.trim() || "-";
  const createdPlace = (formData.get("createdPlace") as string)?.trim() || "Jakarta";
  const memberId = (formData.get("memberId") as string) || "";
  const activityId = (formData.get("activityId") as string) || "";

  if (!letterNumber) {
    return { success: false, error: "Nomor surat permohonan izin wajib diisi." };
  }
  if (!memberName) {
    return { success: false, error: "Nama anggota wajib diisi atau dipilih." };
  }
  if (!reason) {
    return { success: false, error: "Alasan atau keterangan izin wajib diisi." };
  }

  const structuredNotes = JSON.stringify({
    isPermitLetter: true,
    permitType,
    memberId,
    memberName,
    memberNumber,
    groupName,
    scoutLevel,
    classGrade,
    activityId,
    activityTitle,
    startDate,
    endDate,
    reason,
    parentName,
    parentPhone,
    leaderName,
    leaderNip,
    createdPlace,
  });

  const subject = `Surat Izin ${permitType === "SAKIT" ? "Sakit" : "Izin"} - ${memberName} (${activityTitle})`;
  const summary = `Permohonan izin ${permitType === "SAKIT" ? "sakit" : "tidak hadir"} untuk anggota ${memberName} (${memberNumber}, Regu ${groupName}) pada kegiatan ${activityTitle} (${startDate} s.d. ${endDate}). Alasan: ${reason}`;

  try {
    const letter = await prisma.letter.create({
      data: {
        letterNumber,
        type: "KELUAR",
        date: new Date(dateStr),
        subject,
        sender: `Orang Tua / Wali (${parentName})`,
        recipient: `Pembina Gugus Depan (${leaderName})`,
        summary,
        status: "DIKIRIM",
        notes: structuredNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "BUAT_SURAT_IZIN",
        module: "SURAT",
        details: `Membuat surat izin ${permitType}: ${letter.letterNumber} untuk ${memberName}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch (err: any) {
    console.error("Create permit letter error:", err);
    return { success: false, error: "Gagal menyimpan surat izin anggota." };
  }
}

export async function updatePermitLetterAction(id: string, formData: FormData) {
  const session = await requireAuth();

  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak: Hanya Admin dan Sekretaris yang dapat memperbarui surat izin." };
  }

  const letterNumber = (formData.get("letterNumber") as string)?.trim();
  const dateStr = (formData.get("date") as string) || new Date().toISOString();
  const memberName = (formData.get("memberName") as string)?.trim();
  const memberNumber = (formData.get("memberNumber") as string)?.trim() || "-";
  const groupName = (formData.get("groupName") as string)?.trim() || "-";
  const scoutLevel = (formData.get("scoutLevel") as string)?.trim() || "Penggalang";
  const classGrade = (formData.get("classGrade") as string)?.trim() || "";
  const activityTitle = (formData.get("activityTitle") as string)?.trim() || "Kegiatan Pramuka";
  const permitType = (formData.get("permitType") as string) === "SAKIT" ? "SAKIT" : "IZIN";
  const startDate = (formData.get("startDate") as string) || dateStr.split("T")[0];
  const endDate = (formData.get("endDate") as string) || startDate;
  const reason = (formData.get("reason") as string)?.trim() || "Berhalangan hadir";
  const parentName = (formData.get("parentName") as string)?.trim() || "Orang Tua / Wali";
  const parentPhone = (formData.get("parentPhone") as string)?.trim() || "";
  const leaderName = (formData.get("leaderName") as string)?.trim() || "Pembina Satuan";
  const leaderNip = (formData.get("leaderNip") as string)?.trim() || "-";
  const createdPlace = (formData.get("createdPlace") as string)?.trim() || "Jakarta";
  const memberId = (formData.get("memberId") as string) || "";
  const activityId = (formData.get("activityId") as string) || "";

  if (!letterNumber) {
    return { success: false, error: "Nomor surat permohonan izin wajib diisi." };
  }
  if (!memberName) {
    return { success: false, error: "Nama anggota wajib diisi atau dipilih." };
  }

  const structuredNotes = JSON.stringify({
    isPermitLetter: true,
    permitType,
    memberId,
    memberName,
    memberNumber,
    groupName,
    scoutLevel,
    classGrade,
    activityId,
    activityTitle,
    startDate,
    endDate,
    reason,
    parentName,
    parentPhone,
    leaderName,
    leaderNip,
    createdPlace,
  });

  const subject = `Surat Izin ${permitType === "SAKIT" ? "Sakit" : "Izin"} - ${memberName} (${activityTitle})`;
  const summary = `Permohonan izin ${permitType === "SAKIT" ? "sakit" : "tidak hadir"} untuk anggota ${memberName} (${memberNumber}, Regu ${groupName}) pada kegiatan ${activityTitle} (${startDate} s.d. ${endDate}). Alasan: ${reason}`;

  try {
    const letter = await prisma.letter.update({
      where: { id },
      data: {
        letterNumber,
        type: "KELUAR",
        date: new Date(dateStr),
        subject,
        sender: `Orang Tua / Wali (${parentName})`,
        recipient: `Pembina Gugus Depan (${leaderName})`,
        summary,
        notes: structuredNotes,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id,
        userName: session.name,
        action: "UBAH_SURAT_IZIN",
        module: "SURAT",
        details: `Mengubah surat izin ${permitType}: ${letter.letterNumber} untuk ${memberName}`,
      },
    }).catch(() => {});

    revalidatePath("/dashboard/letters");
    return { success: true, data: letter };
  } catch (err: any) {
    console.error("Update permit letter error:", err);
    return { success: false, error: "Gagal memperbarui surat izin anggota." };
  }
}


