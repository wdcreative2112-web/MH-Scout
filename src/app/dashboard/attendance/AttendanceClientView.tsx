"use client";

import React, { useState, useMemo, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  createMeetingAction,
  updateMeetingAction,
  deleteMeetingAction,
  toggleMeetingStatusAction,
  updateRoutineScheduleAction,
  syncRoutineMeetingsAction,
  saveBatchAttendanceAction,
} from "@/actions/attendance";
import {
  payAttendanceFineAction,
  cancelAttendanceFineAction,
  updateFineAmountAction,
} from "@/actions/fines";
import {
  approveLeavePermitAction,
  rejectLeavePermitAction,
} from "@/actions/letters";
import { formatDate, formatDayDate } from "@/lib/utils";
import { downloadElementAsPdf } from "@/lib/pdf-export";
import {
  CheckSquare,
  Plus,
  Users,
  Shield,
  Calendar,
  Check,
  Search,
  Clock,
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  X,
  FileText,
  BarChart2,
  Edit3,
  Trash2,
  RotateCcw,
  Printer,
  Download,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Lock,
  Coins,
  FileSpreadsheet,
  CheckCheck,
  LayoutGrid,
  ArrowLeft,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface RoutineScheduleConfig {
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  location: string;
  titleTemplate: string;
  isActive: boolean;
}

export interface LeaveRequestItem {
  id: string;
  letterNumber: string;
  subject: string;
  status: string;
  date: string;
  meetingId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  groupId: string;
  groupName: string;
  permitType: "IZIN" | "SAKIT";
  reason: string;
  parentName: string;
  statusApproval: "MENUNGGU" | "DISETUJUI" | "DITOLAK";
  submittedByName: string;
  submittedAt: string;
}

interface AttendanceClientViewProps {
  meetings: any[];
  members: any[];
  allMembers?: any[];
  groups: any[];
  activeMeeting: any | null;
  currentRecords: any[];
  canEdit: boolean;
  userRole?: string;
  isKetuaRegu?: boolean;
  userGroupId?: string | null;
  userGroupName?: string | null;
  initialMode: "ALL" | "REGU";
  initialReguId: string;
  routineConfig?: RoutineScheduleConfig | null;
  initialFines?: any[];
  initialFineAmount?: number;
  initialLeaveRequests?: LeaveRequestItem[];
  initialTab?: "MENU" | "SHEET" | "SCHEDULE" | "RECAP" | "FINES";
  lastAuditLog?: {
    userName: string;
    userRole: string;
    createdAt: string;
  } | null;
}

const DAYS_LIST = [
  { value: 0, label: "Minggu" },
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
];

export function AttendanceClientView({
  meetings,
  members,
  allMembers = [],
  groups,
  activeMeeting,
  currentRecords,
  canEdit,
  userRole = "GUEST",
  isKetuaRegu = false,
  userGroupId,
  userGroupName,
  initialMode,
  initialReguId,
  routineConfig,
  initialFines = [],
  initialFineAmount = 5000,
  initialLeaveRequests = [],
  initialTab = "MENU",
  lastAuditLog = null,
}: AttendanceClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab: 'MENU' | 'SHEET' | 'SCHEDULE' | 'RECAP' | 'FINES'
  const [activeTab, setActiveTab] = useState<"MENU" | "SHEET" | "SCHEDULE" | "RECAP" | "FINES">(
    isKetuaRegu ? "SHEET" : initialTab
  );

  // Mode: ALL | REGU
  const [mode, setMode] = useState<"ALL" | "REGU">(initialMode);
  const [selectedReguId, setSelectedReguId] = useState(initialReguId);

  // Search in sheet
  const [searchMember, setSearchMember] = useState("");

  // PDF Export State & Ref for Attendance Recap
  const [isExportingRecapPdf, setIsExportingRecapPdf] = useState(false);
  const recapPrintRef = useRef<HTMLDivElement>(null);

  const handleDownloadRecapPdf = async () => {
    if (!recapPrintRef.current) return;
    setIsExportingRecapPdf(true);
    try {
      const fileName = `Rekap-Presensi-Pramuka-${formatDate(new Date()).replace(/\s+/g, "-")}`;
      await downloadElementAsPdf(recapPrintRef.current, {
        filename: fileName,
        orientation: "portrait",
      });
    } catch (err: any) {
      console.error("Gagal mengunduh PDF rekap:", err);
      alert(err?.message || "Gagal membuat berkas PDF rekap. Silakan coba beberapa saat lagi.");
    } finally {
      setIsExportingRecapPdf(false);
    }
  };

  // Routine Schedule Config state
  const [currentRoutine, setCurrentRoutine] = useState<RoutineScheduleConfig>(
    routineConfig || {
      dayOfWeek: 0,
      dayName: "Minggu",
      startTime: "14:00",
      endTime: "16:30",
      location: "Lapangan Utama Pangkalan",
      titleTemplate: "Latihan Rutin",
      isActive: true,
    }
  );

  // Sheet attendance state: memberId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA">>(() => {
    const map: Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA"> = {};
    const memberIdSet = isKetuaRegu ? new Set(members.map((m) => m.id)) : null;
    currentRecords.forEach((r) => {
      if (!memberIdSet || memberIdSet.has(r.memberId)) {
        map[r.memberId] = r.status;
      }
    });
    return map;
  });

  // Sheet notes state: memberId -> notes (alasan izin / sakit)
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    const memberIdSet = isKetuaRegu ? new Set(members.map((m) => m.id)) : null;
    currentRecords.forEach((r) => {
      if ((!memberIdSet || memberIdSet.has(r.memberId)) && r.notes) {
        map[r.memberId] = r.notes;
      }
    });
    return map;
  });

  // Baseline state to detect unsaved changes
  const initialMap = useMemo(() => {
    const map: Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA"> = {};
    const memberIdSet = isKetuaRegu ? new Set(members.map((m) => m.id)) : null;
    currentRecords.forEach((r) => {
      if (!memberIdSet || memberIdSet.has(r.memberId)) {
        map[r.memberId] = r.status;
      }
    });
    return map;
  }, [currentRecords, isKetuaRegu, members]);

  const initialNotes = useMemo(() => {
    const map: Record<string, string> = {};
    currentRecords.forEach((r) => {
      if (r.notes) map[r.memberId] = r.notes;
    });
    return map;
  }, [currentRecords]);

  // Modal note for member
  const [editingNoteMember, setEditingNoteMember] = useState<{
    id: string;
    name: string;
    status: string;
    note: string;
  } | null>(null);

  // Modals for Meeting & Routine Management
  const [createMeetingModal, setCreateMeetingModal] = useState(false);
  const [routineModal, setRoutineModal] = useState(false);
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<number>(currentRoutine.dayOfWeek);
  const [editMeetingModal, setEditMeetingModal] = useState<any | null>(null);
  const [deleteMeetingConfirm, setDeleteMeetingConfirm] = useState<any | null>(null);

  // Loading & Alert feedback
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Save attendance sheet loading
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Normalize today midnight
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
  }, []);

  // Normalize active session date midnight
  const activeSessionDay = useMemo(() => {
    if (!activeMeeting?.meetingDate) return null;
    const d = new Date(activeMeeting.meetingDate);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }, [activeMeeting]);

  const isTodaySession = useMemo(() => {
    if (!activeSessionDay) return false;
    return activeSessionDay.getTime() === today.getTime();
  }, [activeSessionDay, today]);

  const isFutureSession = useMemo(() => {
    if (!activeSessionDay) return false;
    return activeSessionDay.getTime() > today.getTime();
  }, [activeSessionDay, today]);

  const isPastSession = useMemo(() => {
    if (!activeSessionDay) return false;
    return activeSessionDay.getTime() < today.getTime();
  }, [activeSessionDay, today]);

  const daysDiff = useMemo(() => {
    if (!activeSessionDay) return 0;
    return Math.round((activeSessionDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [activeSessionDay, today]);

  // Global attendance lock logic:
  // - Future sessions: locked until meeting day
  // - Past sessions: locked for Ketua Regu, directly editable for Admin & Sekretaris
  // - Today session: open for attendance recording
  const isAttendanceLocked = useMemo(() => {
    if (!activeMeeting) return true;
    if (activeMeeting.status === "DIBATALKAN") return true;
    if (isFutureSession) return true;
    if (isPastSession && isKetuaRegu) return true;
    return false;
  }, [activeMeeting, isFutureSession, isPastSession, isKetuaRegu]);

  // Check unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const allKeys = new Set([...Object.keys(attendanceMap), ...Object.keys(initialMap)]);
    for (const k of Array.from(allKeys)) {
      if (attendanceMap[k] !== initialMap[k]) return true;
    }
    const allNoteKeys = new Set([...Object.keys(notesMap), ...Object.keys(initialNotes)]);
    for (const k of Array.from(allNoteKeys)) {
      if ((notesMap[k] || "") !== (initialNotes[k] || "")) return true;
    }
    return false;
  }, [attendanceMap, initialMap, notesMap, initialNotes]);

  // Sort meetings by proximity to Hari H (today):
  // 1. Hari H (today, diff === 0)
  // 2. Upcoming meetings closest to Hari H first (e.g. H-1 tomorrow, then H-2, H-8 next week)
  // 3. Past meetings (most recent past to older past)
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => {
      const da = new Date(a.meetingDate);
      const db = new Date(b.meetingDate);
      const dayA = new Date(da.getFullYear(), da.getMonth(), da.getDate(), 0, 0, 0, 0).getTime();
      const dayB = new Date(db.getFullYear(), db.getMonth(), db.getDate(), 0, 0, 0, 0).getTime();

      const diffA = Math.round((dayA - today.getTime()) / (1000 * 60 * 60 * 24));
      const diffB = Math.round((dayB - today.getTime()) / (1000 * 60 * 60 * 24));

      const catA = diffA === 0 ? 0 : diffA > 0 ? 1 : 2;
      const catB = diffB === 0 ? 0 : diffB > 0 ? 1 : 2;

      if (catA !== catB) {
        return catA - catB;
      }
      if (catA === 1) {
        return diffA - diffB; // Closest upcoming to Hari H first
      }
      if (catA === 2) {
        return diffB - diffA; // Most recent past first
      }
      return 0;
    });
  }, [meetings, today]);

  // Schedule filtering & searching
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<"ALL" | "TERJADWAL" | "SELESAI" | "DIBATALKAN">("ALL");
  const [scheduleSearch, setScheduleSearch] = useState("");

  const filteredMeetings = useMemo(() => {
    return sortedMeetings.filter((m) => {
      if (scheduleStatusFilter !== "ALL" && m.status !== scheduleStatusFilter) return false;
      if (scheduleSearch) {
        const q = scheduleSearch.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchAgenda = m.agenda?.toLowerCase().includes(q);
        const matchLocation = m.location?.toLowerCase().includes(q);
        if (!matchTitle && !matchAgenda && !matchLocation) return false;
      }
      return true;
    });
  }, [sortedMeetings, scheduleStatusFilter, scheduleSearch]);

  // Filter members displayed in current sheet
  const displayedMembers = useMemo(() => {
    let list = members;
    if (selectedReguId) {
      list = list.filter((m) => m.groupId === selectedReguId);
    }
    if (searchMember) {
      const q = searchMember.toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          (m.memberNumber && m.memberNumber.toLowerCase().includes(q))
      );
    }
    return list;
  }, [members, selectedReguId, searchMember]);

  // Live Summary counts for the sheet
  const summary = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    let belum = 0;

    displayedMembers.forEach((m) => {
      const st = attendanceMap[m.id];
      if (st === "HADIR") hadir++;
      else if (st === "IZIN") izin++;
      else if (st === "SAKIT") sakit++;
      else if (st === "ALPA") alpa++;
      else belum++;
    });

    return { hadir, izin, sakit, alpa, belum, total: displayedMembers.length };
  }, [displayedMembers, attendanceMap]);

  // Set member status
  const handleSetStatus = (memberId: string, status: "HADIR" | "IZIN" | "SAKIT" | "ALPA") => {
    if (!canEdit || isAttendanceLocked) return;

    // Untuk Ketua Regu, status IZIN dan SAKIT hanya bisa terisi melalui persetujuan surat resmi
    if (isKetuaRegu && (status === "IZIN" || status === "SAKIT")) {
      return;
    }

    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: status,
    }));
    setSaveSuccess(false);
  };

  // Bulk mark all displayed members as HADIR
  const handleMarkAllHadir = () => {
    if (!canEdit || isAttendanceLocked) return;
    if (!confirm("Tandai seluruh anggota yang tampil saat ini sebagai HADIR?")) return;
    const nextMap = { ...attendanceMap };
    displayedMembers.forEach((m) => {
      if (nextMap[m.id] !== "IZIN" && nextMap[m.id] !== "SAKIT") {
        nextMap[m.id] = "HADIR";
      }
    });
    setAttendanceMap(nextMap);
    setSaveSuccess(false);
  };

  // Save attendance sheet to database
  const handleSaveAttendance = async () => {
    if (!activeMeeting || isAttendanceLocked) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    const memberIdSet = isKetuaRegu ? new Set(members.map((m) => m.id)) : null;
    const records = Object.entries(attendanceMap)
      .filter(([memberId]) => !memberIdSet || memberIdSet.has(memberId))
      .map(([memberId, status]) => ({
        memberId,
        status,
        notes: notesMap[memberId] || null,
      }));

    if (records.length === 0) {
      setSaveError("Belum ada status anggota yang dipilih.");
      setSaveLoading(false);
      return;
    }

    try {
      const res = await saveBatchAttendanceAction({
        meetingId: activeMeeting.id,
        records,
      });

      if (!res.success) {
        setSaveError(res.error || "Gagal menyimpan absensi.");
        setSaveLoading(false);
      } else {
        setSaveSuccess(true);
        setSaveLoading(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setSaveError("Terjadi kesalahan jaringan.");
      setSaveLoading(false);
    }
  };

  // Reset unsaved changes back to DB state
  const handleResetSheet = () => {
    setAttendanceMap(initialMap);
    setNotesMap(initialNotes);
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Handle meeting change
  const handleChangeMeeting = (mId: string) => {
    if (hasUnsavedChanges) {
      if (!confirm("Ada perubahan presensi yang belum disimpan. Yakin ingin berganti pertemuan?")) {
        return;
      }
    }
    router.push(`/dashboard/attendance?meetingId=${mId}&mode=${mode}&reguId=${selectedReguId}`);
  };

  // Create single meeting (Jadwal Khusus/Tambahan)
  const handleCreateMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createMeetingAction(formData);
      if (!res.success) {
        setActionError(res.error || "Gagal membuat pertemuan.");
        setActionLoading(false);
      } else {
        setCreateMeetingModal(false);
        setActionLoading(false);
        setActionSuccess("Jadwal pertemuan baru berhasil dibuat!");
        setTimeout(() => setActionSuccess(null), 3000);
        if (res.data?.id) {
          router.push(`/dashboard/attendance?meetingId=${res.data.id}`);
        } else {
          router.refresh();
        }
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
      setActionLoading(false);
    }
  };

  // Update meeting
  const handleUpdateMeeting = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateMeetingAction(formData);
      if (!res.success) {
        setActionError(res.error || "Gagal memperbarui pertemuan.");
        setActionLoading(false);
      } else {
        setEditMeetingModal(null);
        setActionLoading(false);
        setActionSuccess("Jadwal pertemuan berhasil diperbarui!");
        setTimeout(() => setActionSuccess(null), 3000);
        router.refresh();
      }
    } catch {
      setActionError("Terjadi kesalahan jaringan.");
      setActionLoading(false);
    }
  };

  // Quick toggle status of meeting (TERJADWAL / SELESAI / DIBATALKAN)
  const handleToggleStatus = async (meetingId: string, status: "TERJADWAL" | "SELESAI" | "DIBATALKAN") => {
    try {
      const res = await toggleMeetingStatusAction(meetingId, status);
      if (!res.success) {
        alert(res.error || "Gagal mengubah status pertemuan.");
      } else {
        router.refresh();
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // Delete meeting
  const handleDeleteMeeting = async (meetingId: string) => {
    setActionLoading(true);
    try {
      const res = await deleteMeetingAction(meetingId);
      if (!res.success) {
        alert(res.error || "Gagal menghapus pertemuan.");
        setActionLoading(false);
      } else {
        setDeleteMeetingConfirm(null);
        setActionLoading(false);
        setActionSuccess("Jadwal pertemuan berhasil dihapus.");
        setTimeout(() => setActionSuccess(null), 3000);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
      setActionLoading(false);
    }
  };

  // Save Routine Schedule Setting
  const handleSaveRoutineSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("dayOfWeek", String(selectedRoutineDay));

    try {
      const res = await updateRoutineScheduleAction(formData);
      if (!res.success || !res.data) {
        setActionError(res.error || "Gagal menyimpan jadwal rutin.");
        setActionLoading(false);
      } else {
        setRoutineModal(false);
        setActionLoading(false);
        setCurrentRoutine(res.data);
        const extraMsg = res.createdCount && res.createdCount > 0 ? ` (${res.createdCount} sesi terdekat langsung diterbitkan)` : "";
        setActionSuccess(`Jadwal rutin berhasil diatur: Berlaku Setiap Hari ${res.data.dayName} seterusnya!${extraMsg}`);
        setTimeout(() => setActionSuccess(null), 4000);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setActionError("Terjadi kesalahan saat menyimpan jadwal rutin.");
      setActionLoading(false);
    }
  };

  // Manual Trigger Sync Routine Meetings
  const handleSyncRoutine = async () => {
    setActionLoading(true);
    try {
      const res = await syncRoutineMeetingsAction();
      setActionLoading(false);
      if (res.success) {
        const count = res.createdCount ?? 0;
        if (count > 0) {
          setActionSuccess(`Berhasil menerbitkan ${count} sesi latihan rutin baru untuk hari ${currentRoutine.dayName}!`);
        } else {
          setActionSuccess(`Sesi latihan untuk hari ${currentRoutine.dayName} sudah tersedia lengkap di daftar.`);
        }
        setTimeout(() => setActionSuccess(null), 3000);
        startTransition(() => {
          router.refresh();
        });
      } else {
        alert(res.error || "Gagal melakukan sinkronisasi.");
      }
    } catch {
      setActionLoading(false);
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // =========================================================================
  // DENDA ABSENSI (ALPA) STATE & HANDLERS
  // =========================================================================
  const [fines, setFines] = useState<any[]>(initialFines);
  const [fineAmount, setFineAmount] = useState<number>(initialFineAmount);
  const [fineStatusFilter, setFineStatusFilter] = useState<"ALL" | "BELUM_LUNAS" | "LUNAS">("ALL");
  const [fineReguFilter, setFineReguFilter] = useState<string>(isKetuaRegu && userGroupId ? userGroupId : "ALL");
  const [fineSearch, setFineSearch] = useState<string>("");
  const [fineActionLoadingId, setFineActionLoadingId] = useState<string | null>(null);
  const [fineActionError, setFineActionError] = useState<string | null>(null);
  const [fineActionSuccess, setFineActionSuccess] = useState<string | null>(null);

  // Fine tariff update state
  const [isEditingTariff, setIsEditingTariff] = useState(false);
  const [tariffInput, setTariffInput] = useState<number>(initialFineAmount);
  const [tariffLoading, setTariffLoading] = useState(false);

  // PDF Export for Fines
  const [isExportingFinePdf, setIsExportingFinePdf] = useState(false);
  const finesPrintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFines(initialFines);
  }, [initialFines]);

  useEffect(() => {
    setFineAmount(initialFineAmount);
    setTariffInput(initialFineAmount);
  }, [initialFineAmount]);

  // Handle pay fine (LUNAS)
  const handlePayFine = async (fineId: string, memberName: string) => {
    if (!confirm(`Tandai denda untuk ${memberName} sebesar Rp ${fineAmount.toLocaleString("id-ID")} sebagai LUNAS dan catat ke Buku Kas Pemasukan?`)) {
      return;
    }
    setFineActionLoadingId(fineId);
    setFineActionError(null);
    setFineActionSuccess(null);
    try {
      const res = await payAttendanceFineAction(fineId);
      if (!res.success) {
        setFineActionError(res.error || "Gagal mencatat pelunasan denda.");
      } else {
        setFineActionSuccess(`Pelunasan denda untuk ${memberName} berhasil dicatat ke Kas Satuan.`);
        setTimeout(() => setFineActionSuccess(null), 4000);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setFineActionError("Terjadi kesalahan jaringan.");
    } finally {
      setFineActionLoadingId(null);
    }
  };

  // Handle cancel fine
  const handleCancelFine = async (fineId: string, memberName: string) => {
    if (!confirm(`Batalkan tagihan denda untuk ${memberName}? Tindakan ini akan menghapus tagihan denda.`)) {
      return;
    }
    setFineActionLoadingId(fineId);
    setFineActionError(null);
    setFineActionSuccess(null);
    try {
      const res = await cancelAttendanceFineAction(fineId);
      if (!res.success) {
        setFineActionError(res.error || "Gagal membatalkan denda.");
      } else {
        setFineActionSuccess(`Tagihan denda untuk ${memberName} berhasil dibatalkan.`);
        setTimeout(() => setFineActionSuccess(null), 4000);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setFineActionError("Terjadi kesalahan jaringan.");
    } finally {
      setFineActionLoadingId(null);
    }
  };

  // Handle update tariff
  const handleUpdateTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    setTariffLoading(true);
    setFineActionError(null);
    try {
      const res = await updateFineAmountAction(tariffInput);
      if (!res.success) {
        setFineActionError(res.error || "Gagal memperbarui tarif denda.");
      } else {
        setFineAmount(tariffInput);
        setIsEditingTariff(false);
        setFineActionSuccess(`Tarif denda alpa berhasil diubah menjadi Rp ${tariffInput.toLocaleString("id-ID")}`);
        setTimeout(() => setFineActionSuccess(null), 4000);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      setFineActionError("Terjadi kesalahan sistem saat memperbarui tarif.");
    } finally {
      setTariffLoading(false);
    }
  };

  // Handle download PDF for fines
  const handleDownloadFinePdf = async () => {
    if (!finesPrintRef.current) return;
    setIsExportingFinePdf(true);
    try {
      const fileName = `Laporan-Denda-Presensi-Pramuka-${formatDate(new Date()).replace(/\s+/g, "-")}`;
      await downloadElementAsPdf(finesPrintRef.current, {
        filename: fileName,
        orientation: "portrait",
      });
    } catch (err: any) {
      console.error("Gagal cetak PDF denda:", err);
      alert(err?.message || "Gagal membuat berkas PDF denda.");
    } finally {
      setIsExportingFinePdf(false);
    }
  };

  // Handle Export CSV for fines
  const handleExportFineCSV = () => {
    if (filteredFines.length === 0) {
      alert("Tidak ada data denda untuk diekspor.");
      return;
    }
    const headers = ["No", "Tanggal / Sesi", "Nama Anggota", "NTA", "Regu", "Nominal (Rp)", "Status", "Tanggal Bayar", "Keterangan"];
    const rows = filteredFines.map((f, idx) => [
      idx + 1,
      `"${f.periodName || "-"}"`,
      `"${f.memberName}"`,
      `"${f.memberNumber || "-"}"`,
      `"${f.groupName}"`,
      f.amount,
      `"${f.status === "LUNAS" ? "Lunas" : "Belum Bayar"}"`,
      `"${f.paidAt ? formatDate(f.paidAt) : "-"}"`,
      `"${(f.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan-Denda-Presensi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered fines
  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      // Status filter
      if (fineStatusFilter !== "ALL" && f.status !== fineStatusFilter) return false;
      // Regu filter
      if (fineReguFilter !== "ALL" && f.groupId !== fineReguFilter) return false;
      // Search
      if (fineSearch.trim()) {
        const q = fineSearch.toLowerCase();
        const mName = (f.memberName || "").toLowerCase();
        const mNum = (f.memberNumber || "").toLowerCase();
        const mGroup = (f.groupName || "").toLowerCase();
        if (!mName.includes(q) && !mNum.includes(q) && !mGroup.includes(q)) return false;
      }
      return true;
    });
  }, [fines, fineStatusFilter, fineReguFilter, fineSearch]);

  const unpaidFinesCount = useMemo(() => fines.filter((f) => f.status === "BELUM_LUNAS").length, [fines]);
  const totalFinesNominal = useMemo(() => fines.reduce((sum, f) => sum + (f.amount || 0), 0), [fines]);
  const paidFinesNominal = useMemo(() => fines.filter((f) => f.status === "LUNAS").reduce((sum, f) => sum + (f.amount || 0), 0), [fines]);
  const unpaidFinesNominal = useMemo(() => fines.filter((f) => f.status === "BELUM_LUNAS").reduce((sum, f) => sum + (f.amount || 0), 0), [fines]);

  // =========================================================================
  // SURAT PERMOHONAN IZIN / SAKIT ANGGOTA (LEAVE REQUESTS)
  // =========================================================================
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(initialLeaveRequests || []);
  const [leaveApprovalLoadingId, setLeaveApprovalLoadingId] = useState<string | null>(null);

  useEffect(() => {
    setLeaveRequests(initialLeaveRequests || []);
  }, [initialLeaveRequests]);

  // Lookup map for leave requests on the active meeting
  const activeMeetingLeaveMap = useMemo(() => {
    if (!activeMeeting) return {};
    const map: Record<string, LeaveRequestItem> = {};
    leaveRequests
      .filter((lr) => lr.meetingId === activeMeeting.id)
      .forEach((lr) => {
        map[lr.memberId] = lr;
      });
    return map;
  }, [leaveRequests, activeMeeting]);

  // Pending leaves for active meeting
  const pendingActiveMeetingLeaves = useMemo(() => {
    if (!activeMeeting) return [];
    return leaveRequests.filter(
      (lr) => lr.meetingId === activeMeeting.id && lr.statusApproval === "MENUNGGU"
    );
  }, [leaveRequests, activeMeeting]);

  // Quick Approve Leave (Admin/Sekretaris)
  const handleApproveLeave = async (letterId: string, memberName: string, memberId: string, permitType: "IZIN" | "SAKIT") => {
    if (
      !confirm(
        `Setujui permohonan izin untuk ${memberName}? Status presensi akan otomatis diubah menjadi ${permitType} dan denda alpa akan dibatalkan.`
      )
    ) {
      return;
    }
    setLeaveApprovalLoadingId(letterId);
    try {
      const res = await approveLeavePermitAction(letterId);
      if (!res.success) {
        alert(res.error || "Gagal memproses persetujuan izin.");
      } else {
        setAttendanceMap((prev) => ({
          ...prev,
          [memberId]: permitType,
        }));
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLeaveApprovalLoadingId(null);
    }
  };

  // Quick Reject Leave (Admin/Sekretaris)
  const handleRejectLeave = async (letterId: string, memberName: string, memberId: string) => {
    const reason = prompt(
      `Masukkan alasan penolakan izin untuk ${memberName}:`,
      "Permohonan tidak memenuhi syarat / tidak ada keterangan sah"
    );
    if (reason === null) return;
    setLeaveApprovalLoadingId(letterId);
    try {
      const res = await rejectLeavePermitAction(letterId, reason);
      if (!res.success) {
        alert(res.error || "Gagal memproses penolakan izin.");
      } else {
        setAttendanceMap((prev) => ({
          ...prev,
          [memberId]: "ALPA",
        }));
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setLeaveApprovalLoadingId(null);
    }
  };

  // Valid meetings for recapitulation (exclude DIBATALKAN)
  const validMeetings = useMemo(() => {
    return meetings.filter((m) => m.status !== "DIBATALKAN");
  }, [meetings]);

  const canceledMeetingsCount = useMemo(() => {
    return meetings.filter((m) => m.status === "DIBATALKAN").length;
  }, [meetings]);

  // Recap statistics members pool
  const recapMembers = useMemo(() => {
    return isKetuaRegu ? members : (allMembers.length > 0 ? allMembers : members);
  }, [isKetuaRegu, members, allMembers]);

  // Group Leaderboard stats
  const groupStats = useMemo(() => {
    return groups.map((g) => {
      const gMembers = recapMembers.filter((m) => m.groupId === g.id);
      let totalAttended = 0;
      let totalSlots = gMembers.length * validMeetings.length;

      validMeetings.forEach((m) => {
        gMembers.forEach((mem) => {
          const rec = m.records?.find((r: any) => r.memberId === mem.id);
          if (rec?.status === "HADIR") totalAttended++;
        });
      });

      const percentage = totalSlots > 0 ? Math.round((totalAttended / totalSlots) * 100) : 0;
      return {
        id: g.id,
        name: g.name,
        category: g.category,
        memberCount: gMembers.length,
        totalAttended,
        percentage,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [groups, recapMembers, validMeetings]);

  // Overall Gudep attendance percentage
  const overallPercentage = useMemo(() => {
    if (validMeetings.length === 0 || recapMembers.length === 0) return 0;
    let totalHadir = 0;
    const totalSlots = validMeetings.length * recapMembers.length;

    validMeetings.forEach((m) => {
      recapMembers.forEach((mem) => {
        const rec = m.records?.find((r: any) => r.memberId === mem.id);
        if (rec?.status === "HADIR") totalHadir++;
      });
    });

    return totalSlots > 0 ? Math.round((totalHadir / totalSlots) * 100) : 0;
  }, [validMeetings, recapMembers]);

  // Member recap table filters
  const [recapReguFilter, setRecapReguFilter] = useState("ALL");
  const [recapSearchMember, setRecapSearchMember] = useState("");

  const filteredRecapMembers = useMemo(() => {
    return recapMembers.filter((m) => {
      if (recapReguFilter !== "ALL" && m.groupId !== recapReguFilter) return false;
      if (recapSearchMember) {
        const q = recapSearchMember.toLowerCase();
        const matchName = m.fullName.toLowerCase().includes(q);
        const matchNo = m.memberNumber?.toLowerCase().includes(q);
        if (!matchName && !matchNo) return false;
      }
      return true;
    });
  }, [recapMembers, recapReguFilter, recapSearchMember]);

  // Export CSV Function
  const handleExportCSV = () => {
    const headers = [
      "No",
      "Nama Anggota",
      "Nomor Anggota",
      "Regu",
      "Tingkatan",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpa",
      "Total Pertemuan Valid",
      "Persentase Kehadiran",
    ];

    const rows = filteredRecapMembers.map((member, index) => {
      let hCount = 0;
      let iCount = 0;
      let sCount = 0;
      let aCount = 0;

      validMeetings.forEach((m) => {
        const rec = m.records?.find((r: any) => r.memberId === member.id);
        if (rec?.status === "HADIR") hCount++;
        else if (rec?.status === "IZIN") iCount++;
        else if (rec?.status === "SAKIT") sCount++;
        else if (rec?.status === "ALPA") aCount++;
      });

      const percentage = validMeetings.length > 0 ? Math.round((hCount / validMeetings.length) * 100) : 0;

      return [
        index + 1,
        `"${member.fullName}"`,
        `"${member.memberNumber || "-"}"`,
        `"${member.group?.name || "-"}"`,
        `"${member.scoutLevel || "-"}"`,
        hCount,
        iCount,
        sCount,
        aCount,
        validMeetings.length,
        `"${percentage}%"`,
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rekap_presensi_pramuka_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* GLOBAL FEEDBACK NOTIFICATIONS */}
      {actionSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button type="button" onClick={() => setActionSuccess(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {isKetuaRegu ? `Presensi Latihan Regu ${userGroupName ? `— ${userGroupName}` : ""}` : "Presensi & Jadwal Latihan"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {isKetuaRegu
                  ? "Pencatatan status kehadiran anggota regu pada sesi pertemuan latihan."
                  : "Manajemen jadwal latihan mingguan, pencatatan presensi terpadu, dan rekapitulasi kehadiran."}
              </p>
            </div>
          </div>
        </div>

        {/* TOP CONTEXTUAL ACTIONS */}
        <div className="flex flex-wrap items-center gap-2">
          {!isKetuaRegu && activeTab !== "MENU" && (
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shadow-2xs transition-all active:scale-95"
            >
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              <span>Menu Utama</span>
            </button>
          )}

          {/* Routine & Manual Schedule Action Buttons when in SCHEDULE */}
          {canEdit && !isKetuaRegu && activeTab === "SCHEDULE" && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setSelectedRoutineDay(currentRoutine.dayOfWeek);
                  setRoutineModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                title="Atur hari latihan rutin berulang permanen (setiap Minggu/Senin/dll.)"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Atur Jadwal Rutin</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-black">
                  {currentRoutine.dayName}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setCreateMeetingModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                title="Buat satu sesi pertemuan latihan secara manual"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Jadwal</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: PORTAL HUB / MENU UTAMA ABSENSI                                    */}
      {/* ========================================================================= */}
      {!isKetuaRegu && activeTab === "MENU" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* 4 Large Interactive Feature Cards - 2 Columns on Mobile & Desktop */}
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            {/* Card 1: Lembar Presensi */}
            <div
              onClick={() => setActiveTab("SHEET")}
              className="group relative bg-white hover:bg-slate-50/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-slate-200/80 hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                    <CheckSquare className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  {isTodaySession ? (
                    <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Hari-H
                    </span>
                  ) : (
                    <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-slate-100 text-slate-700 text-[9px] sm:text-[11px] font-bold">
                      Presensi
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors mt-2.5 sm:mt-4 leading-tight">
                  Lembar Presensi
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Catat status kehadiran peserta (Hadir, Izin, Sakit, Alpa) per pertemuan atau per regu.
                </p>

                {/* Micro Stats */}
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-xs">
                  <div className="truncate max-w-full">
                    <span className="text-slate-400 block text-[8px] sm:text-[10px] uppercase font-bold">Sesi:</span>
                    <strong className="text-slate-800 truncate block text-[10px] sm:text-xs">
                      {activeMeeting ? formatDayDate(activeMeeting.meetingDate) : "-"}
                    </strong>
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-black text-[9px] sm:text-[11px] shrink-0">
                    Terisi {summary.total - summary.belum}/{summary.total}
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-black text-emerald-700 group-hover:text-emerald-800">
                <span>Buka Presensi</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Card 2: Kelola Jadwal Latihan */}
            <div
              onClick={() => setActiveTab("SCHEDULE")}
              className="group relative bg-white hover:bg-slate-50/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-slate-200/80 hover:border-blue-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                    <Calendar className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-100 text-blue-800 text-[9px] sm:text-[11px] font-bold">
                    Rutin: {currentRoutine.dayName}
                  </span>
                </div>

                <h3 className="text-sm sm:text-xl font-black text-slate-900 group-hover:text-blue-700 transition-colors mt-2.5 sm:mt-4 leading-tight">
                  Kelola Jadwal
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Atur jadwal latihan rutin mingguan permanen atau buat jadwal pertemuan khusus.
                </p>

                {/* Micro Stats */}
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-xs">
                  <div>
                    <span className="text-slate-400 block text-[8px] sm:text-[10px] uppercase font-bold">Total:</span>
                    <strong className="text-slate-800 block text-[10px] sm:text-xs">{meetings.length} Sesi</strong>
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-black text-[9px] sm:text-[11px] shrink-0">
                    {meetings.filter((m) => m.status !== "DIBATALKAN").length} Aktif
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-black text-blue-700 group-hover:text-blue-800">
                <span>Atur Jadwal</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-blue-50 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Card 3: Rekapitulasi & Laporan */}
            <div
              onClick={() => setActiveTab("RECAP")}
              className="group relative bg-white hover:bg-slate-50/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-slate-200/80 hover:border-violet-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                    <BarChart2 className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-violet-100 text-violet-800 text-[9px] sm:text-[11px] font-bold">
                    Statistik & PDF
                  </span>
                </div>

                <h3 className="text-sm sm:text-xl font-black text-slate-900 group-hover:text-violet-700 transition-colors mt-2.5 sm:mt-4 leading-tight">
                  Rekapitulasi
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Pantau statistik kehadiran Gudep, leaderboard regu, & cetak laporan PDF resmi.
                </p>

                {/* Micro Stats */}
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-xs">
                  <div>
                    <span className="text-slate-400 block text-[8px] sm:text-[10px] uppercase font-bold">Rata-rata:</span>
                    <strong className="text-slate-800 block text-[10px] sm:text-xs">{overallPercentage}% Hadir</strong>
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 rounded-lg bg-violet-100 text-violet-800 font-black text-[9px] sm:text-[11px] shrink-0">
                    {validMeetings.length} Sesi
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-black text-violet-700 group-hover:text-violet-800">
                <span>Buka Rekap</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-violet-50 group-hover:bg-violet-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Card 4: Kelola Denda (Alpa) */}
            <div
              onClick={() => setActiveTab("FINES")}
              className="group relative bg-white hover:bg-slate-50/50 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border-2 border-slate-200/80 hover:border-amber-500 shadow-xs hover:shadow-xl transition-all duration-200 cursor-pointer text-left flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-600 group-hover:text-white transition-all shadow-2xs shrink-0">
                    <Coins className="w-5 h-5 sm:w-7 sm:h-7" />
                  </div>
                  {unpaidFinesCount > 0 ? (
                    <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-100 text-rose-800 text-[9px] sm:text-[11px] font-black animate-pulse">
                      {unpaidFinesCount} Tunggakan
                    </span>
                  ) : (
                    <span className="self-start sm:self-auto px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 text-emerald-800 text-[9px] sm:text-[11px] font-bold">
                      Tertib
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors mt-2.5 sm:mt-4 leading-tight">
                  Kelola Denda
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  Denda alpa, verifikasi kas satuan, dan laporan keuangan.
                </p>

                {/* Micro Stats */}
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-100 mt-2.5 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] sm:text-xs">
                  <div>
                    <span className="text-slate-400 block text-[8px] sm:text-[10px] uppercase font-bold">Kas:</span>
                    <strong className="text-emerald-700 block text-[10px] sm:text-xs">Rp {paidFinesNominal.toLocaleString("id-ID")}</strong>
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-black text-[9px] sm:text-[11px] shrink-0">
                    Rp {fineAmount.toLocaleString("id-ID")}/alpa
                  </span>
                </div>
              </div>

              <div className="mt-3 sm:mt-5 pt-2 sm:pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs font-black text-amber-700 group-hover:text-amber-800">
                <span>Kelola Denda</span>
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-50 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-all shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts & Audit Footer */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900">Rekam Jejak Presensi Terakhir</p>
                <p className="text-slate-500 mt-0.5">
                  {lastAuditLog ? (
                    <>
                      Diubah oleh <strong className="text-slate-700">{lastAuditLog.userName}</strong> ({lastAuditLog.userRole}) pada {formatDate(lastAuditLog.createdAt)}
                    </>
                  ) : (
                    "Belum ada log pengubahan terkini."
                  )}
                </p>
              </div>
            </div>

            {canEdit && !isKetuaRegu && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setSelectedRoutineDay(currentRoutine.dayOfWeek);
                    setRoutineModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-amber-200/60"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-600" />
                  <span>Atur Jadwal Rutin</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setCreateMeetingModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Buat Pertemuan Baru</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: LEMBAR PRESENSI (ATTENDANCE SHEET)                                  */}
      {/* ========================================================================= */}
      {activeTab === "SHEET" && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Navigation Breadcrumb back to Menu Hub */}
          {!isKetuaRegu && (
            <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs no-print">
              <button
                type="button"
                onClick={() => setActiveTab("MENU")}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all border border-slate-200/60 hover:border-emerald-200"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-600" />
                <span>← Kembali ke Menu Utama</span>
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 hidden sm:inline">Modul Aktif:</span>
                <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                  Lembar Presensi
                </span>
              </div>
            </div>
          )}
          {/* Active Meeting Context Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Meeting Dropdown Selector */}
              <div className="flex-1 max-w-xl">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilih Sesi Pertemuan Latihan:
                </label>
                <div className="relative">
                  <select
                    value={activeMeeting?.id || ""}
                    onChange={(e) => handleChangeMeeting(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/70 text-slate-900 shadow-2xs"
                  >
                    {sortedMeetings.map((m) => {
                      const mDate = new Date(m.meetingDate);
                      const mDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate(), 0, 0, 0, 0);
                      const isToday = mDay.getTime() === today.getTime();
                      const isFuture = mDay.getTime() > today.getTime();
                      const recCount = m.records?.length || 0;

                      let titlePart = "";
                      if (m.title && !m.title.toLowerCase().startsWith("latihan rutin minggu ke-")) {
                        titlePart = ` — ${m.title}`;
                      }

                      let statusBadge = "";
                      if (m.status === "DIBATALKAN") {
                        statusBadge = " [Dibatalkan]";
                      } else if (isToday) {
                        statusBadge = recCount > 0 ? " [Hari Ini • Terisi]" : " [Hari Ini]";
                      } else if (isFuture) {
                        statusBadge = " [Mendatang]";
                      } else if (recCount > 0) {
                        statusBadge = " [Terisi]";
                      } else {
                        statusBadge = " [Belum Diisi]";
                      }

                      return (
                        <option key={m.id} value={m.id}>
                          {isToday ? "🟢 " : ""}{formatDayDate(m.meetingDate)}{titlePart}{statusBadge}
                        </option>
                      );
                    })}
                    {sortedMeetings.length === 0 && <option value="">(Belum ada jadwal pertemuan)</option>}
                  </select>
                </div>
              </div>

              {/* Status and Action Details */}
              <div className="flex flex-wrap items-center gap-2">
                {isKetuaRegu ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
                    <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">Presensi Regu</p>
                      <p className="text-xs font-black text-amber-950">
                        {userGroupName || "Regu Anda"} ({displayedMembers.length} Anggota)
                      </p>
                    </div>
                  </div>
                ) : (
                  activeMeeting && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${
                          activeMeeting.status === "SELESAI"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : activeMeeting.status === "DIBATALKAN"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {activeMeeting.status}
                      </span>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => setEditMeetingModal(activeMeeting)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Ubah Info Sesi</span>
                        </button>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Active Meeting Metadata */}
            {activeMeeting && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {activeMeeting.startTime || "14:00"} - {activeMeeting.endTime || "16:30"} WIB
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activeMeeting.location || "Pangkalan"}
                  </span>
                  {activeMeeting.agenda && (
                    <span className="flex items-center gap-1.5 text-slate-500 truncate max-w-md">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Materi: {activeMeeting.agenda}
                    </span>
                  )}
                </div>

                {summary.total > 0 && activeMeeting.status !== "DIBATALKAN" && (
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
                    summary.belum === 0
                      ? "bg-emerald-100 text-emerald-800"
                      : summary.belum < summary.total
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {summary.belum === 0 ? "✓ Presensi Lengkap" : `Terisi ${summary.total - summary.belum}/${summary.total}`}
                  </span>
                )}
              </div>
            )}

            {/* Simple Non-Intrusive Status Notices */}
            {activeMeeting?.status === "DIBATALKAN" && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Pertemuan ini dibatalkan ({activeMeeting.notes || "kegiatan ditiadakan"}). Data presensi tidak dihitung dalam rekapitulasi.</span>
              </div>
            )}

            {activeMeeting && isFutureSession && activeMeeting.status !== "DIBATALKAN" && (
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600 shrink-0" />
                  <span className="font-semibold">
                    Sesi latihan dijadwalkan pada {formatDayDate(activeMeeting.meetingDate)} (H-{daysDiff}). Pengisian presensi dibuka saat hari kegiatan berlangsung.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-sky-200 text-sky-900 text-[10px] font-black uppercase shrink-0">
                  Terkunci
                </span>
              </div>
            )}

            {activeMeeting && isPastSession && activeMeeting.status !== "DIBATALKAN" && isKetuaRegu && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center gap-2.5 text-xs font-semibold">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Sesi latihan lampau terkunci untuk Ketua Regu. Hubungi Pembina / Admin jika diperlukan koreksi data.</span>
              </div>
            )}

            {activeMeeting && isPastSession && activeMeeting.status !== "DIBATALKAN" && !isKetuaRegu && (
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-between gap-2 text-xs">
                <span className="font-medium">
                  Sesi lampau ({formatDayDate(activeMeeting.meetingDate)}) — Anda dapat langsung mengoreksi data presensi sebagai Admin.
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0">
                  Mode Arsip Aktif
                </span>
              </div>
            )}

            {activeMeeting && isTodaySession && activeMeeting.status !== "DIBATALKAN" && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-emerald-900">
                    Sesi Latihan Hari Ini ({formatDayDate(activeMeeting.meetingDate)}) — Pengisian Presensi Aktif
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase shrink-0">
                  Hari-H
                </span>
              </div>
            )}

            {/* Pending Leave Requests Alert Banner */}
            {activeMeeting && pendingActiveMeetingLeaves.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-950">
                      Terdapat {pendingActiveMeetingLeaves.length} Permohonan Surat Izin/Sakit Menunggu Persetujuan
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      {isKetuaRegu
                        ? "Permohonan izin anggota telah diajukan ke Pembina / Admin dan sedang ditinjau."
                        : "Ketua Regu telah mengajukan surat izin ketidakhadiran. Tinjau & berikan persetujuan di bawah ini atau di modul Surat."}
                    </p>
                  </div>
                </div>
                {!isKetuaRegu ? (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/letters")}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Buka Menu Surat</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/attendance/izin")}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer"
                  >
                    <span>Lihat Status Izin</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {isKetuaRegu && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    Ada anggota yang berhalangan hadir? Ajukan surat izin sebelum sesi latihan agar diverifikasi dan di-ACC oleh Admin.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/attendance/izin")}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Halaman Pengajuan Izin</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* REALTIME ATTENDANCE LIVE COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">Hadir</span>
              <span className="text-xl sm:text-2xl font-black mt-0.5 block text-emerald-900">{summary.hadir}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">
                {summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0}% Anggota
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 block">Izin</span>
              <span className="text-xl sm:text-2xl font-black mt-0.5 block text-blue-900">{summary.izin}</span>
              <span className="text-[10px] text-blue-600 font-semibold block">Disertai surat/ket</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">Sakit</span>
              <span className="text-xl sm:text-2xl font-black mt-0.5 block text-amber-900">{summary.sakit}</span>
              <span className="text-[10px] text-amber-600 font-semibold block">Alasan kesehatan</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 block">Alpa</span>
              <span className="text-xl sm:text-2xl font-black mt-0.5 block text-rose-900">{summary.alpa}</span>
              <span className="text-[10px] text-rose-600 font-semibold block">
                {fineAmount > 0 && summary.alpa > 0
                  ? `Denda Rp ${(summary.alpa * fineAmount).toLocaleString("id-ID")}`
                  : fineAmount > 0
                  ? `Denda Rp ${fineAmount.toLocaleString("id-ID")}/org`
                  : "Tanpa keterangan"}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-center shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">Belum Diisi</span>
              <span className="text-xl sm:text-2xl font-black mt-0.5 block text-slate-900">{summary.belum}</span>
              <span className="text-[10px] text-slate-500 font-semibold block">Perlu dicek</span>
            </div>
          </div>

          {/* FEEDBACK ALERTS */}
          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">Data absensi berhasil disimpan ke database!</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">Tersinkronisasi otomatis</span>
            </div>
          )}

          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-bold">{saveError}</span>
            </div>
          )}

          {/* UNIFIED FILTER & ACTION TOOLBAR */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
              {/* Member Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  placeholder="Cari nama anggota atau nomor..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Regu Filter Dropdown (Admin/Sekretaris) */}
              {!isKetuaRegu && (
                <select
                  value={selectedReguId}
                  onChange={(e) => setSelectedReguId(e.target.value)}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 bg-white text-slate-800"
                >
                  <option value="">Semua Regu ({members.length})</option>
                  {groups.map((g) => {
                    const count = members.filter((m) => m.groupId === g.id).length;
                    return (
                      <option key={g.id} value={g.id}>
                        {g.name} ({count})
                      </option>
                    );
                  })}
                </select>
              )}

              {lastAuditLog && (
                <div className="text-[11px] text-slate-500 font-medium hidden lg:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Diubah: <strong>{lastAuditLog.userName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            {canEdit && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isAttendanceLocked}
                  onClick={handleMarkAllHadir}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                    isAttendanceLocked
                      ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-700"
                  }`}
                  title={isAttendanceLocked ? "Sesi latihan terkunci untuk pengisian presensi" : undefined}
                >
                  Tandai Semua Hadir
                </button>

                <button
                  type="button"
                  disabled={saveLoading || isAttendanceLocked}
                  onClick={handleSaveAttendance}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-xs transition-all ${
                    isAttendanceLocked
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95 disabled:opacity-50"
                  }`}
                  title={isAttendanceLocked ? "Sesi latihan terkunci untuk pengisian presensi" : undefined}
                >
                  {saveLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{saveLoading ? "Menyimpan..." : "Simpan Presensi"}</span>
                </button>
              </div>
            )}
          </div>

          {/* COMPACT MEMBER ATTENDANCE LIST */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {displayedMembers.length > 0 ? (
              displayedMembers.map((member) => {
                const currentStatus = attendanceMap[member.id];
                const note = notesMap[member.id];
                const leaveItem = activeMeetingLeaveMap[member.id];

                return (
                  <div
                    key={member.id}
                    className="px-4 py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Left: Member Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                          currentStatus === "HADIR"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : currentStatus === "IZIN"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : currentStatus === "SAKIT"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : currentStatus === "ALPA"
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {currentStatus ? currentStatus[0] : member.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {member.fullName}
                          </p>
                          {member.group && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-900 text-[10px] font-black shrink-0">
                              {member.group.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                          <span>{member.memberNumber || "No ID -"}</span>
                          <span>•</span>
                          <span>{member.scoutLevel || "Penggalang"}</span>
                          {note && (
                            <>
                              <span>•</span>
                              <span className="text-blue-700 font-medium truncate max-w-xs inline-flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 shrink-0" />
                                {note}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Leave Permit Status Badge */}
                        {leaveItem && (
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {leaveItem.statusApproval === "MENUNGGU" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[10px] animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Permohonan {leaveItem.permitType === "SAKIT" ? "Sakit" : "Izin"} Menunggu Persetujuan
                              </span>
                            ) : leaveItem.statusApproval === "DISETUJUI" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                                Izin Disetujui ({leaveItem.permitType})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-600" />
                                Izin Ditolak
                              </span>
                            )}

                            {/* Admin / Pembina Quick Decision Buttons */}
                            {canEdit && !isKetuaRegu && leaveItem.statusApproval === "MENUNGGU" && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={leaveApprovalLoadingId === leaveItem.id}
                                  onClick={() =>
                                    handleApproveLeave(
                                      leaveItem.id,
                                      leaveItem.memberName,
                                      leaveItem.memberId,
                                      leaveItem.permitType
                                    )
                                  }
                                  className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-2xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Setujui permohonan surat izin & update presensi"
                                >
                                  {leaveApprovalLoadingId === leaveItem.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <Check className="w-2.5 h-2.5" />
                                  )}
                                  <span>Setujui</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={leaveApprovalLoadingId === leaveItem.id}
                                  onClick={() =>
                                    handleRejectLeave(leaveItem.id, leaveItem.memberName, leaveItem.memberId)
                                  }
                                  className="px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Tolak permohonan izin (status akan menjadi Alpa)"
                                >
                                  <X className="w-2.5 h-2.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Segmented Status Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {isKetuaRegu ? (
                        currentStatus === "IZIN" || currentStatus === "SAKIT" ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                                currentStatus === "SAKIT"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {currentStatus === "SAKIT" ? "Sakit (ACC Admin)" : "Izin (ACC Admin)"}
                            </span>
                            <button
                              type="button"
                              disabled={!canEdit || isAttendanceLocked}
                              onClick={() => handleSetStatus(member.id, "HADIR")}
                              className="px-2 py-0.5 rounded-md bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-bold text-[10px] border border-slate-200 transition-colors cursor-pointer"
                              title="Klik jika anggota ternyata hadir di lokasi kegiatan"
                            >
                              Hadir?
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
                            <button
                              type="button"
                              disabled={!canEdit || isAttendanceLocked}
                              onClick={() => handleSetStatus(member.id, "HADIR")}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === "HADIR"
                                  ? "bg-emerald-600 text-white shadow-xs font-black"
                                  : "text-slate-600 hover:text-emerald-700 hover:bg-white/60"
                              } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                            >
                              Hadir
                            </button>
                            <button
                              type="button"
                              disabled={!canEdit || isAttendanceLocked}
                              onClick={() => handleSetStatus(member.id, "ALPA")}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                currentStatus === "ALPA"
                                  ? "bg-rose-600 text-white shadow-xs font-black"
                                  : "text-slate-600 hover:text-rose-700 hover:bg-white/60"
                              } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                              title={fineAmount > 0 ? `Alpa dikenakan denda Rp ${fineAmount.toLocaleString("id-ID")}` : "Alpa"}
                            >
                              <span>Alpa</span>
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200/80">
                          <button
                            type="button"
                            disabled={!canEdit || isAttendanceLocked}
                            onClick={() => handleSetStatus(member.id, "HADIR")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "HADIR"
                                ? "bg-emerald-600 text-white shadow-xs font-black"
                                : "text-slate-600 hover:text-emerald-700 hover:bg-white/60"
                            } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            Hadir
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit || isAttendanceLocked}
                            onClick={() => handleSetStatus(member.id, "IZIN")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "IZIN"
                                ? "bg-blue-600 text-white shadow-xs font-black"
                                : "text-slate-600 hover:text-blue-700 hover:bg-white/60"
                            } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            Izin
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit || isAttendanceLocked}
                            onClick={() => handleSetStatus(member.id, "SAKIT")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "SAKIT"
                                ? "bg-amber-600 text-white shadow-xs font-black"
                                : "text-slate-600 hover:text-amber-700 hover:bg-white/60"
                            } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                          >
                            Sakit
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit || isAttendanceLocked}
                            onClick={() => handleSetStatus(member.id, "ALPA")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              currentStatus === "ALPA"
                                ? "bg-rose-600 text-white shadow-xs font-black"
                                : "text-slate-600 hover:text-rose-700 hover:bg-white/60"
                            } ${isAttendanceLocked ? "cursor-not-allowed opacity-60" : ""}`}
                            title={fineAmount > 0 ? `Alpa dikenakan denda Rp ${fineAmount.toLocaleString("id-ID")}` : "Alpa"}
                          >
                            <span>Alpa</span>
                          </button>
                        </div>
                      )}

                      {/* Optional Note Button */}
                      {(canEdit || note) && (
                        <button
                          type="button"
                          onClick={() =>
                            setEditingNoteMember({
                              id: member.id,
                              name: member.fullName,
                              status: currentStatus || "HADIR",
                              note: note || "",
                            })
                          }
                          className={`p-2 rounded-xl text-xs transition-colors border ${
                            note
                              ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                              : isAttendanceLocked
                              ? "bg-slate-50 border-transparent text-slate-300 cursor-not-allowed"
                              : "bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                          }`}
                          disabled={isAttendanceLocked && !note}
                          title={note ? `Catatan: ${note}` : "Tambah keterangan/alasan"}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">
                Tidak ada anggota yang cocok dengan filter atau pencarian saat ini.
              </div>
            )}
          </div>

          {/* FLOATING BAR FOR UNSAVED CHANGES */}
          {hasUnsavedChanges && !isAttendanceLocked && (
            <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-between sm:justify-start gap-4 border border-slate-700/80 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold">Ada perubahan yang belum disimpan</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetSheet}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Reset
                </button>

                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveAttendance}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KELOLA JADWAL LATIHAN (SCHEDULE MANAGEMENT)                         */}
      {/* ========================================================================= */}
      {!isKetuaRegu && activeTab === "SCHEDULE" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Navigation Breadcrumb back to Menu Hub */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs no-print">
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-all border border-slate-200/60 hover:border-blue-200"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>← Kembali ke Menu Utama</span>
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Modul Aktif:</span>
              <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                Kelola Jadwal Latihan
              </span>
            </div>
          </div>
          {/* Standing Routine Training Info Banner */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 sm:p-6 text-emerald-950 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-emerald-950">
                  Jadwal Latihan Rutin Otomatis
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    currentRoutine.isActive
                      ? "bg-emerald-200 text-emerald-900 border border-emerald-300"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {currentRoutine.isActive ? "Aktif Berjalan" : "Nonaktif"}
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed max-w-3xl">
                Latihan rutin dijadwalkan <strong>Setiap Hari {currentRoutine.dayName}</strong> ({currentRoutine.startTime} - {currentRoutine.endTime} WIB) di <em>{currentRoutine.location}</em>. Sesi presensi akan otomatis terbit pada setiap hari {currentRoutine.dayName} seterusnya tanpa batas minggu.
              </p>
            </div>

            {canEdit && !isKetuaRegu && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActionError(null);
                    setSelectedRoutineDay(currentRoutine.dayOfWeek);
                    setRoutineModal(true);
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Ubah Hari Rutin</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncRoutine}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-emerald-950 border border-emerald-300 font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  title="Periksa dan terbitkan sesi terdekat sekarang jika belum ada"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                  <span>Sinkronkan Sesi</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateMeetingModal(true)}
                  className="px-3.5 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Jadwal</span>
                </button>
              </div>
            )}
          </div>

          {/* Schedule Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setScheduleStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  scheduleStatusFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Semua Jadwal ({meetings.length})
              </button>
              <button
                type="button"
                onClick={() => setScheduleStatusFilter("TERJADWAL")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  scheduleStatusFilter === "TERJADWAL"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Terjadwal ({meetings.filter((m) => m.status === "TERJADWAL").length})
              </button>
              <button
                type="button"
                onClick={() => setScheduleStatusFilter("SELESAI")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  scheduleStatusFilter === "SELESAI"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Selesai ({meetings.filter((m) => m.status === "SELESAI").length})
              </button>
              <button
                type="button"
                onClick={() => setScheduleStatusFilter("DIBATALKAN")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  scheduleStatusFilter === "DIBATALKAN"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Dibatalkan ({canceledMeetingsCount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                placeholder="Cari judul atau agenda..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => {
                const recordedCount = meeting.records?.length || 0;
                const totalMembers = members.length;
                const recordPercent = totalMembers > 0 ? Math.round((recordedCount / totalMembers) * 100) : 0;

                return (
                  <div
                    key={meeting.id}
                    className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all hover:shadow-md ${
                      meeting.status === "DIBATALKAN"
                        ? "border-rose-200 bg-rose-50/20"
                        : meeting.status === "SELESAI"
                        ? "border-slate-200"
                        : "border-blue-200 bg-blue-50/20"
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Attendance Fill Status Badge */}
                          {meeting.status !== "DIBATALKAN" && (
                            recordPercent >= 100 ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Sudah Terisi</span>
                              </span>
                            ) : recordedCount > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Terisi Sebagian</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-300">
                                Belum Diisi
                              </span>
                            )
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              meeting.status === "SELESAI"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : meeting.status === "DIBATALKAN"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {meeting.status}
                          </span>

                          {(() => {
                            const cardMDate = new Date(meeting.meetingDate);
                            const cardMDay = new Date(cardMDate.getFullYear(), cardMDate.getMonth(), cardMDate.getDate(), 0, 0, 0, 0);
                            const isCardToday = cardMDay.getTime() === today.getTime();
                            const isCardFuture = cardMDay.getTime() > today.getTime();
                            const cardDaysDiff = Math.round((cardMDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                            if (isCardFuture && meeting.status !== "DIBATALKAN") {
                              return (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 inline-flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" /> H-{cardDaysDiff}
                                </span>
                              );
                            }
                            if (isCardToday && meeting.status !== "DIBATALKAN") {
                              return (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                  🟢 Hari Ini
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatDayDate(meeting.meetingDate)}
                        </span>
                      </div>

                      {/* Title & Agenda */}
                      <h4 className="font-black text-sm sm:text-base text-slate-900 mt-2.5 leading-snug">
                        {meeting.title && !meeting.title.toLowerCase().startsWith("latihan rutin minggu ke-")
                          ? meeting.title
                          : formatDayDate(meeting.meetingDate)}
                      </h4>

                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meeting.startTime || "14:00"} - {meeting.endTime || "16:30"} WIB</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{meeting.location || "Pangkalan"}</span>
                        </p>
                        {meeting.agenda && (
                          <p className="text-slate-500 line-clamp-2 pt-1 border-t border-slate-100 text-[11px]">
                            {meeting.agenda}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attendance Progress & Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                          <span>Status Presensi</span>
                          <span className="text-slate-800">
                            {recordedCount} / {totalMembers} Anggota ({recordPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              recordPercent >= 80 ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                            style={{ width: `${Math.min(recordPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        {(() => {
                          const cardMDate = new Date(meeting.meetingDate);
                          const cardMDay = new Date(cardMDate.getFullYear(), cardMDate.getMonth(), cardMDate.getDate(), 0, 0, 0, 0);
                          const isCardFuture = cardMDay.getTime() > today.getTime();

                          return (
                            <button
                              type="button"
                              onClick={() => {
                                handleChangeMeeting(meeting.id);
                                setActiveTab("SHEET");
                              }}
                              className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs text-center transition-all shadow-2xs inline-flex items-center justify-center gap-1.5 ${
                                isCardFuture
                                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  : recordPercent >= 100
                                  ? "bg-emerald-700 hover:bg-emerald-600 text-white"
                                  : recordedCount > 0
                                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
                              }`}
                            >
                              {isCardFuture ? (
                                <>
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>Lihat Sesi (Terkunci)</span>
                                </>
                              ) : recordPercent >= 100 ? (
                                <>
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit / Ubah Absensi</span>
                                </>
                              ) : recordedCount > 0 ? (
                                <>
                                  <Edit3 className="w-3 h-3" />
                                  <span>Lanjutkan / Edit Absensi</span>
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="w-3 h-3" />
                                  <span>Mulai Isi Absensi</span>
                                </>
                              )}
                            </button>
                          );
                        })()}

                        {canEdit && !isKetuaRegu && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditMeetingModal(meeting)}
                              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Edit Pertemuan"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Quick status toggle */}
                            {meeting.status === "TERJADWAL" && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(meeting.id, "SELESAI")}
                                className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Tandai Selesai"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}

                            {meeting.status !== "DIBATALKAN" ? (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(meeting.id, "DIBATALKAN")}
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                                title="Batalkan Pertemuan"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(meeting.id, "TERJADWAL")}
                                className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Aktifkan Kembali"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteMeetingConfirm(meeting)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Pertemuan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-xs text-slate-400">
                Tidak ada jadwal pertemuan yang sesuai dengan filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REKAPITULASI & LAPORAN (RECAP & REPORTING)                           */}
      {/* ========================================================================= */}
      {!isKetuaRegu && activeTab === "RECAP" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Navigation Breadcrumb back to Menu Hub */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs no-print">
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-violet-700 hover:bg-violet-50 transition-all border border-slate-200/60 hover:border-violet-200"
            >
              <ArrowLeft className="w-4 h-4 text-violet-600" />
              <span>← Kembali ke Menu Utama</span>
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Modul Aktif:</span>
              <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                Rekapitulasi Kehadiran
              </span>
            </div>
          </div>
          {/* Summary KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Tingkat Kehadiran Gudep</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{overallPercentage}%</div>
              <p className="text-[11px] text-slate-500">
                Rata-rata kehadiran seluruh anggota aktif pada pertemuan aktif.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Pertemuan Valid</span>
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{validMeetings.length}</div>
              <p className="text-[11px] text-slate-500">
                {canceledMeetingsCount} sesi dibatalkan tidak dihitung.
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Regu Paling Disiplin</span>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-950 truncate">
                {groupStats[0]?.name || "-"}
              </div>
              <p className="text-[11px] text-amber-800 font-semibold">
                Peringkat #1 dengan {groupStats[0]?.percentage || 0}% Kehadiran
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Total Anggota Terdata</span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-3xl font-black text-slate-900">{recapMembers.length}</div>
              <p className="text-[11px] text-slate-500">Terdaftar dalam {groups.length} regu aktif.</p>
            </div>
          </div>

          {/* Leaderboard Regu / Barisan */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  Peringkat Disiplin Kehadiran per Regu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dihitung dari persentase kehadiran anggota regu pada {validMeetings.length} sesi latihan aktif.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupStats.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          index === 0
                            ? "bg-amber-400 text-amber-950"
                            : index === 1
                            ? "bg-slate-300 text-slate-800"
                            : index === 2
                            ? "bg-amber-700 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="font-black text-sm text-slate-900">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {item.percentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{item.memberCount} Anggota</span>
                    <span>{item.category || "Regu"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Recapitulation Detailed Table */}
          <div
            ref={recapPrintRef}
            id="printable-attendance-recap"
            className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0"
          >
            {/* Formal Kop Surat for PDF & Physical Print */}
            <div className="border-b-2 border-slate-900 pb-3 mb-2">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.jpeg"
                    alt="Logo Pramuka"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1 text-center font-sans">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                    GERAKAN PRAMUKA GUGUS DEPAN
                  </h2>
                  <h1 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight">
                    MH SCOUT • PANGKALAN MASLAHATUL HIDAYAH
                  </h1>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    LAPORAN REKAPITULASI PRESENSI & KEHADIRAN ANGGOTA
                  </p>
                </div>
                <div className="w-14 h-14 shrink-0 hidden sm:flex items-center justify-center">
                  <img
                    src="/logo.jpeg"
                    alt="Tunas Kelapa"
                    className="w-10 h-10 object-contain opacity-90"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 mt-2 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1">
                <span>
                  Total Sesi: <strong>{validMeetings.length} Sesi Latihan</strong> | Filter:{" "}
                  <strong>
                    {recapReguFilter === "ALL"
                      ? "Semua Regu"
                      : groups.find((g) => g.id === recapReguFilter)?.name || "Regu Terpilih"}
                  </strong>
                </span>
                <span>
                  Tanggal Rekap: <strong>{formatDate(new Date())}</strong>
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Laporan Rekapitulasi Presensi Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar akumulasi kehadiran tiap anggota selama periode latihan aktif.
                </p>
              </div>

              {/* Action Buttons: Unduh PDF, Cetak Fisik, Export CSV */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadRecapPdf}
                  disabled={isExportingRecapPdf}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-60"
                  title="Unduh langsung file dokumen PDF rekapitulasi ke komputer/HP"
                >
                  {isExportingRecapPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Membuat PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh File PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-slate-700"
                  title="Cetak langsung menggunakan printer fisik"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Fisik</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                  title="Export data ke format spreadsheet CSV"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Filter controls within recap */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 print:hidden">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={recapSearchMember}
                  onChange={(e) => setRecapSearchMember(e.target.value)}
                  placeholder="Cari nama anggota..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {!isKetuaRegu && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Filter Regu:</span>
                  <select
                    value={recapReguFilter}
                    onChange={(e) => setRecapReguFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="ALL">Semua Regu</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Mobile Cards (Visible only on interactive screen, hidden in print/PDF) */}
            <div className="md:hidden print:hidden space-y-3">
              {filteredRecapMembers.length > 0 ? (
                filteredRecapMembers.map((member, idx) => {
                  let hCount = 0;
                  let iCount = 0;
                  let sCount = 0;
                  let aCount = 0;

                  validMeetings.forEach((m) => {
                    const rec = m.records?.find((r: any) => r.memberId === member.id);
                    if (rec?.status === "HADIR") hCount++;
                    else if (rec?.status === "IZIN") iCount++;
                    else if (rec?.status === "SAKIT") sCount++;
                    else if (rec?.status === "ALPA") aCount++;
                  });

                  const percentage =
                    validMeetings.length > 0
                      ? Math.round((hCount / validMeetings.length) * 100)
                      : 0;

                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                    >
                      {/* Card Header: Avatar + Nama + Regu + Percentage Badge */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/50">
                            {member.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {member.fullName}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                              <span>#{idx + 1}</span>
                              <span>•</span>
                              <span className="font-mono">{member.memberNumber || "-"}</span>
                              {member.group && (
                                <>
                                  <span>•</span>
                                  <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200/60">
                                    {member.group.name}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 font-black px-2.5 py-1 rounded-xl text-xs shadow-2xs ${
                            percentage >= 80
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                              : percentage >= 50
                              ? "bg-amber-100 text-amber-900 border border-amber-200"
                              : "bg-rose-100 text-rose-900 border border-rose-200"
                          }`}
                        >
                          {percentage}%
                        </span>
                      </div>

                      {/* Attendance Breakdown Grid: 4 Pills */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100 text-center">
                        <div className="p-2 rounded-xl bg-emerald-50/80 border border-emerald-100 text-emerald-950">
                          <span className="text-[10px] font-bold text-emerald-700 block">Hadir</span>
                          <span className="text-sm font-black text-emerald-900 block mt-0.5">{hCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-100 text-blue-950">
                          <span className="text-[10px] font-bold text-blue-700 block">Izin</span>
                          <span className="text-sm font-black text-blue-900 block mt-0.5">{iCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-100 text-amber-950">
                          <span className="text-[10px] font-bold text-amber-700 block">Sakit</span>
                          <span className="text-sm font-black text-amber-900 block mt-0.5">{sCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-100 text-rose-950">
                          <span className="text-[10px] font-bold text-rose-700 block">Alpa</span>
                          <span className="text-sm font-black text-rose-900 block mt-0.5">{aCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                  Tidak ada data anggota yang sesuai.
                </div>
              )}
            </div>

            {/* Structured Table (Always used for clean print/PDF) */}
            <div className="hidden md:block print:block overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Regu / Golongan</th>
                    <th className="p-3 text-center text-emerald-800">Hadir</th>
                    <th className="p-3 text-center text-blue-800">Izin</th>
                    <th className="p-3 text-center text-amber-800">Sakit</th>
                    <th className="p-3 text-center text-rose-800">Alpa</th>
                    <th className="p-3 text-right">Persentase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecapMembers.length > 0 ? (
                    filteredRecapMembers.map((member, idx) => {
                      let hCount = 0;
                      let iCount = 0;
                      let sCount = 0;
                      let aCount = 0;

                      validMeetings.forEach((m) => {
                        const rec = m.records?.find((r: any) => r.memberId === member.id);
                        if (rec?.status === "HADIR") hCount++;
                        else if (rec?.status === "IZIN") iCount++;
                        else if (rec?.status === "SAKIT") sCount++;
                        else if (rec?.status === "ALPA") aCount++;
                      });

                      const percentage =
                        validMeetings.length > 0
                          ? Math.round((hCount / validMeetings.length) * 100)
                          : 0;

                      return (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 text-center text-slate-500 font-bold">{idx + 1}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{member.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{member.memberNumber || "-"}</p>
                          </td>
                          <td className="p-3 font-medium text-slate-600">
                            {member.group?.name || "-"}
                          </td>
                          <td className="p-3 text-center font-bold text-emerald-700 bg-emerald-50/40">
                            {hCount}
                          </td>
                          <td className="p-3 text-center font-bold text-blue-700 bg-blue-50/40">
                            {iCount}
                          </td>
                          <td className="p-3 text-center font-bold text-amber-700 bg-amber-50/40">
                            {sCount}
                          </td>
                          <td className="p-3 text-center font-bold text-rose-700 bg-rose-50/40">
                            {aCount}
                          </td>
                          <td className="p-3 text-right">
                            <span
                              className={`font-black px-2 py-0.5 rounded text-xs ${
                                percentage >= 80
                                  ? "bg-emerald-100 text-emerald-900"
                                  : percentage >= 50
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-rose-100 text-rose-900"
                              }`}
                            >
                              {percentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        Tidak ada data anggota yang sesuai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Formal Signature Block for Attendance Official Report */}
            <div className="pt-8 mt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-sans">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-1">Pembina Gugus Depan</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Pembina Satuan</p>
                <p className="text-[10px] text-slate-500">NTA. Gerakan Pramuka</p>
              </div>
              <div>
                <p className="text-slate-500">Dibuat oleh,</p>
                <p className="font-bold text-slate-900 mt-1">Sekretaris / Petugas Presensi</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Pengurus Satuan</p>
                <p className="text-[10px] text-slate-500">MH Scout Pangkalan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KELOLA DENDA KETIDAKHADIRAN (ALPA)                                 */}
      {/* ========================================================================= */}
      {!isKetuaRegu && activeTab === "FINES" && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Navigation Breadcrumb back to Menu Hub */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs no-print">
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-amber-700 hover:bg-amber-50 transition-all border border-slate-200/60 hover:border-amber-200"
            >
              <ArrowLeft className="w-4 h-4 text-amber-600" />
              <span>← Kembali ke Menu Utama</span>
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 hidden sm:inline">Modul Aktif:</span>
              <span className="font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                Kelola Denda (Alpa)
              </span>
            </div>
          </div>
          {/* Action Notifications / Alerts */}
          {fineActionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{fineActionError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFineActionError(null)}
                className="p-1 text-rose-500 hover:text-rose-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {fineActionSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{fineActionSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setFineActionSuccess(null)}
                className="p-1 text-emerald-500 hover:text-emerald-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total Denda Dicatat */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Tagihan Denda
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 mt-2">
                Rp {totalFinesNominal.toLocaleString("id-ID")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                <span className="font-bold text-slate-700">{fines.length}</span>
                <span>catatan pelanggaran alpa</span>
              </div>
            </div>

            {/* KPI 2: Total Denda Terkumpul (Masuk Kas) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Telah Lunas (Masuk Kas)
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                Rp {paidFinesNominal.toLocaleString("id-ID")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <span>{fines.filter((f) => f.status === "LUNAS").length} transaksi lunas di kas</span>
              </div>
            </div>

            {/* KPI 3: Belum Bayar (Tunggakan) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Belum Bayar (Tunggakan)
                </span>
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-700 mt-2">
                Rp {unpaidFinesNominal.toLocaleString("id-ID")}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <span>{unpaidFinesCount} anggota perlu melunasi</span>
              </div>
            </div>

            {/* KPI 4: Tarif Denda per Alpa & Setting */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tarif Denda per Alpa
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
              </div>
              {!isEditingTariff ? (
                <>
                  <p className="text-2xl font-black text-slate-900 mt-2">
                    Rp {fineAmount.toLocaleString("id-ID")}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">per kehadiran alpa</span>
                    {canEdit && !isKetuaRegu && (
                      <button
                        type="button"
                        onClick={() => setIsEditingTariff(true)}
                        className="text-xs font-bold text-amber-700 hover:text-amber-800 underline"
                      >
                        Ubah Tarif
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <form onSubmit={handleUpdateTariff} className="mt-2 space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={tariffInput}
                      onChange={(e) => setTariffInput(Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={tariffLoading}
                      className="flex-1 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 disabled:opacity-50"
                    >
                      {tariffLoading ? "..." : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTariff(false)}
                      className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Table Filters & Export Actions Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Left: Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anggota, NTA, atau regu..."
                  value={fineSearch}
                  onChange={(e) => setFineSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                {fineSearch && (
                  <button
                    type="button"
                    onClick={() => setFineSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFineStatusFilter("ALL")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    fineStatusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-black"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua ({fines.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFineStatusFilter("BELUM_LUNAS")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    fineStatusFilter === "BELUM_LUNAS"
                      ? "bg-rose-600 text-white shadow-2xs font-black"
                      : "text-slate-600 hover:text-rose-700"
                  }`}
                >
                  Belum Bayar ({unpaidFinesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFineStatusFilter("LUNAS")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    fineStatusFilter === "LUNAS"
                      ? "bg-emerald-600 text-white shadow-2xs font-black"
                      : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  Lunas ({fines.length - unpaidFinesCount})
                </button>
              </div>

              {/* Regu Filter & Export Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {!isKetuaRegu && (
                  <select
                    value={fineReguFilter}
                    onChange={(e) => setFineReguFilter(e.target.value)}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ALL">Semua Regu</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Export Buttons */}
                <button
                  type="button"
                  disabled={isExportingFinePdf}
                  onClick={handleDownloadFinePdf}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
                  title="Unduh Laporan Denda Resmi dalam format PDF"
                >
                  {isExportingFinePdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{isExportingFinePdf ? "Memproses PDF..." : "Cetak PDF"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportFineCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  title="Ekspor data denda ke file Excel/CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Fines Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-3.5 w-12 text-center">No</th>
                    <th className="py-3 px-4">Pertemuan & Keterangan</th>
                    <th className="py-3 px-4">Anggota</th>
                    <th className="py-3 px-3">Regu</th>
                    <th className="py-3 px-4 text-right">Nominal</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi / Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredFines.length > 0 ? (
                    filteredFines.map((fine, idx) => {
                      const isLoadingThis = fineActionLoadingId === fine.id;
                      return (
                        <tr key={fine.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3.5 text-center text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{fine.periodName || "Denda Alpa"}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Dicatat: {formatDate(fine.createdAt)}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{fine.memberName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              NTA: {fine.memberNumber || "-"}
                            </p>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {fine.groupName}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-slate-900">
                              Rp {Number(fine.amount).toLocaleString("id-ID")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {fine.status === "LUNAS" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Lunas</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Belum Bayar</span>
                              </span>
                            )}
                            {fine.paidAt && (
                              <p className="text-[10px] text-slate-400 mt-0.5">
                                Dibayar: {formatDate(fine.paidAt)}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {fine.status === "BELUM_LUNAS" ? (
                              canEdit && !isKetuaRegu ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isLoadingThis}
                                    onClick={() => handlePayFine(fine.id, fine.memberName)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    title="Tandai denda ini lunas dan masukkan ke Buku Kas Satuan"
                                  >
                                    {isLoadingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5" />
                                    )}
                                    <span>Tandai Lunas</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isLoadingThis}
                                    onClick={() => handleCancelFine(fine.id, fine.memberName)}
                                    className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                    title="Batalkan tagihan denda"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">
                                  Menunggu Pembayaran
                                </span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Tercatat di Kas Satuan</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Coins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-500">Tidak ada data denda yang ditemukan.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Semua anggota hadir atau belum ada pelanggaran alpa tercatat.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-2 border-t border-slate-100">
              <span>
                Menampilkan <strong>{filteredFines.length}</strong> dari total <strong>{fines.length}</strong> catatan denda
              </span>
              <span>
                Total Nominal Terpilih:{" "}
                <strong className="text-slate-900">
                  Rp {filteredFines.reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString("id-ID")}
                </strong>
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PRINTABLE DOKUMEN LAPORAN DENDA PRESENSI                                   */}
          {/* ========================================================================= */}
          <div
            ref={finesPrintRef}
            id="printable-fines-report"
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 print:border-none print:shadow-none print:p-0"
          >
            {/* Kop Surat Resmi */}
            <div className="border-b-2 border-slate-900 pb-3 mb-2">
              <div className="flex items-center justify-between gap-4">
                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <img
                    src="/logo.jpeg"
                    alt="Logo Pramuka"
                    className="w-12 h-12 object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1 text-center font-sans">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-600">
                    GERAKAN PRAMUKA GUGUS DEPAN
                  </h2>
                  <h1 className="text-sm sm:text-base font-black uppercase text-slate-900 tracking-tight">
                    MH SCOUT • PANGKALAN MASLAHATUL HIDAYAH
                  </h1>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                    LAPORAN DENDA KETIDAKHADIRAN (ALPA) ANGGOTA
                  </p>
                </div>
                <div className="w-14 h-14 shrink-0 hidden sm:flex items-center justify-center">
                  <img
                    src="/logo.jpeg"
                    alt="Tunas Kelapa"
                    className="w-10 h-10 object-contain opacity-90"
                  />
                </div>
              </div>
              <div className="border-t border-slate-200 mt-2 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-600 gap-1">
                <span>
                  Dicetak pada: <strong>{formatDate(new Date())}</strong> | Filter:{" "}
                  <strong>
                    {fineReguFilter === "ALL"
                      ? "Semua Regu"
                      : groups.find((g) => g.id === fineReguFilter)?.name || "Regu Terpilih"}
                  </strong>
                </span>
                <span>
                  Status:{" "}
                  <strong>
                    {fineStatusFilter === "ALL"
                      ? "Semua Status"
                      : fineStatusFilter === "LUNAS"
                      ? "Lunas"
                      : "Belum Bayar"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Summary Box in Report */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Total Pelanggaran Alpa</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{filteredFines.length} Kasus</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Telah Masuk Kas (Lunas)</p>
                <p className="text-base font-black text-emerald-700 mt-0.5">
                  Rp {filteredFines.filter((f) => f.status === "LUNAS").reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString("id-ID")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Tunggakan Belum Bayar</p>
                <p className="text-base font-black text-rose-700 mt-0.5">
                  Rp {filteredFines.filter((f) => f.status === "BELUM_LUNAS").reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            {/* Print Table */}
            <table className="w-full text-left text-[11px] border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold">
                  <th className="py-2 px-2.5 text-center border-r border-slate-300 w-10">No</th>
                  <th className="py-2 px-3 border-r border-slate-300">Pertemuan & Keterangan</th>
                  <th className="py-2 px-3 border-r border-slate-300">Nama Anggota</th>
                  <th className="py-2 px-2.5 text-center border-r border-slate-300">Regu</th>
                  <th className="py-2 px-3 text-right border-r border-slate-300">Nominal</th>
                  <th className="py-2 px-3 text-center border-r border-slate-300">Status</th>
                  <th className="py-2 px-3 text-center">Tgl Lunas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredFines.length > 0 ? (
                  filteredFines.map((fine, idx) => (
                    <tr key={`print-${fine.id}`} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 text-center border-r border-slate-200">{idx + 1}</td>
                      <td className="py-2 px-3 border-r border-slate-200">{fine.periodName || "Denda Alpa"}</td>
                      <td className="py-2 px-3 font-bold border-r border-slate-200">{fine.memberName}</td>
                      <td className="py-2 px-2.5 text-center border-r border-slate-200">{fine.groupName}</td>
                      <td className="py-2 px-3 text-right font-mono border-r border-slate-200">
                        Rp {Number(fine.amount).toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 px-3 text-center font-bold border-r border-slate-200">
                        {fine.status === "LUNAS" ? "Lunas" : "Belum Bayar"}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500">
                        {fine.paidAt ? formatDate(fine.paidAt) : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Tidak ada catatan denda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Signature Block */}
            <div className="pt-6 mt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs font-sans">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold text-slate-900 mt-1">Pembina Gugus Depan</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Pembina Satuan</p>
                <p className="text-[10px] text-slate-500">NTA. Gerakan Pramuka</p>
              </div>
              <div>
                <p className="text-slate-500">Dibuat oleh,</p>
                <p className="font-bold text-slate-900 mt-1">Bendahara Satuan</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Pengurus Satuan</p>
                <p className="text-[10px] text-slate-500">MH Scout Pangkalan</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ATUR JADWAL RUTIN MINGGUAN PERMANEN (HARI BERJALAN SETERUSNYA)    */}
      {/* ========================================================================= */}
      {routineModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Pengaturan Jadwal Rutin</h3>
                  <p className="text-xs text-slate-500">Berlaku otomatis pada hari yang dipilih seterusnya</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoutineModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoutineSchedule} className="space-y-4">
              {/* Day of Week Selector Buttons */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase mb-2">
                  Pilih Hari Latihan Rutin *
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_LIST.map((day) => {
                    const isSelected = selectedRoutineDay === day.value;
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => setSelectedRoutineDay(day.value)}
                        className={`py-2 px-1 text-xs font-black rounded-xl text-center transition-all ${
                          isSelected
                            ? "bg-amber-600 text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-amber-800 font-semibold mt-2">
                  🎯 Sesi latihan akan otomatis berlaku pada setiap <strong>Hari {DAYS_LIST[selectedRoutineDay]?.label}</strong> seterusnya.
                </p>
              </div>

              {/* Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={currentRoutine.startTime}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={currentRoutine.endTime}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lokasi Latihan Rutin</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={currentRoutine.location}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Title Template */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Format Penamaan Pertemuan
                </label>
                <input
                  type="text"
                  name="titleTemplate"
                  defaultValue={currentRoutine.titleTemplate}
                  placeholder="Latihan Rutin Minggu ke-{n}"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Toggle Active */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-amber-950">Terbitkan Sesi Otomatis Seterusnya</p>
                  <p className="text-[11px] text-amber-800">
                    Sistem otomatis memastikan sesi di hari tersebut selalu tersedia untuk diabsen.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={currentRoutine.isActive}
                  className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoutineModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan & Terapkan Jadwal Rutin</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUAT JADWAL TUNGGAL / KHUSUS                                      */}
      {/* ========================================================================= */}
      {createMeetingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Buat Jadwal Latihan</h3>
                <p className="text-xs text-slate-500">Buat sesi pertemuan baru atau jadwal khusus tambahan</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateMeetingModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Pertemuan *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={`Latihan Rutin Minggu ke-${meetings.length + 1}`}
                  placeholder="Contoh: Latihan Rutin Minggu ke-1 atau Persiapan Lomba"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Latihan *
                </label>
                <input
                  type="date"
                  name="meetingDate"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={currentRoutine.startTime}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={currentRoutine.endTime}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lokasi Latihan</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={currentRoutine.location}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Awal</label>
                <select
                  name="status"
                  defaultValue="TERJADWAL"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white font-bold"
                >
                  <option value="TERJADWAL">TERJADWAL</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DIBATALKAN">DIBATALKAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agenda / Materi Latihan</label>
                <textarea
                  name="agenda"
                  rows={2}
                  placeholder="Materi tali-temali, sandi semaphore, PBB..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateMeetingModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Jadwal</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UBAH DATA PERTEMUAN (EDIT MEETING)                                */}
      {/* ========================================================================= */}
      {editMeetingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Ubah Data Pertemuan</h3>
              <button
                type="button"
                onClick={() => setEditMeetingModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateMeeting} className="space-y-4">
              <input type="hidden" name="id" value={editMeetingModal.id} />

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Judul Pertemuan *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editMeetingModal.title}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tanggal Latihan *
                </label>
                <input
                  type="date"
                  name="meetingDate"
                  required
                  defaultValue={
                    editMeetingModal.meetingDate
                      ? new Date(editMeetingModal.meetingDate).toISOString().split("T")[0]
                      : ""
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Waktu Mulai</label>
                  <input
                    type="time"
                    name="startTime"
                    defaultValue={editMeetingModal.startTime || "14:00"}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Waktu Selesai</label>
                  <input
                    type="time"
                    name="endTime"
                    defaultValue={editMeetingModal.endTime || "16:30"}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status Pertemuan</label>
                <select
                  name="status"
                  defaultValue={editMeetingModal.status}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white font-bold"
                >
                  <option value="TERJADWAL">TERJADWAL</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DIBATALKAN">DIBATALKAN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lokasi Latihan</label>
                <input
                  type="text"
                  name="location"
                  defaultValue={editMeetingModal.location || "Pangkalan"}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Agenda / Materi</label>
                <textarea
                  name="agenda"
                  rows={2}
                  defaultValue={editMeetingModal.agenda || ""}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editMeetingModal.notes || ""}
                  placeholder="Alasan perubahan/pembatalan jika ada..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMeetingModal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS PERTEMUAN                                        */}
      {/* ========================================================================= */}
      {deleteMeetingConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Hapus Jadwal Latihan?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah Anda yakin ingin menghapus pertemuan <strong>&ldquo;{deleteMeetingConfirm.title}&rdquo;</strong>?
                Data absensi pada pertemuan ini juga akan ikut terhapus.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteMeetingConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleDeleteMeeting(deleteMeetingConfirm.id)}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{actionLoading ? "Menghapus..." : "Ya, Hapus"}</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT KETERANGAN / CATATAN ANGGOTA (IZIN / SAKIT)                  */}
      {/* ========================================================================= */}
      {editingNoteMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-black text-slate-900">Keterangan Presensi</h4>
              </div>
              <button
                type="button"
                onClick={() => setEditingNoteMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Anggota: <strong className="text-slate-900">{editingNoteMember.name}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                Status saat ini: <span className="font-bold text-slate-700">{editingNoteMember.status}</span>
              </p>
            </div>

            {isAttendanceLocked && (
              <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                <span>Mode hanya-baca: Sesi terkunci untuk pengubahan data.</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Alasan / Catatan (misal: Demam, Acara Keluarga):
              </label>
              <input
                type="text"
                autoFocus={!isAttendanceLocked}
                readOnly={isAttendanceLocked}
                disabled={isAttendanceLocked}
                value={editingNoteMember.note}
                onChange={(e) =>
                  setEditingNoteMember({ ...editingNoteMember, note: e.target.value })
                }
                placeholder={isAttendanceLocked ? "(Tidak ada catatan khusus)" : "Tuliskan keterangan..."}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 disabled:bg-slate-50 disabled:text-slate-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingNoteMember(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {isAttendanceLocked ? "Tutup" : "Batal"}
              </button>
              {!isAttendanceLocked && (
                <button
                  type="button"
                  onClick={() => {
                    setNotesMap((prev) => ({
                      ...prev,
                      [editingNoteMember.id]: editingNoteMember.note.trim(),
                    }));
                    setEditingNoteMember(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  Simpan Catatan
                </button>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
