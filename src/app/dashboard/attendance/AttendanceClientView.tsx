"use client";

import React, { useState, useMemo, useTransition } from "react";
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
import { formatDate, formatDayDate } from "@/lib/utils";
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
}: AttendanceClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tab: 'SHEET' | 'SCHEDULE' | 'RECAP'
  const [activeTab, setActiveTab] = useState<"SHEET" | "SCHEDULE" | "RECAP">("SHEET");

  // Mode: ALL | REGU
  const [mode, setMode] = useState<"ALL" | "REGU">(initialMode);
  const [selectedReguId, setSelectedReguId] = useState(initialReguId);

  // Search in sheet
  const [searchMember, setSearchMember] = useState("");

  // Routine Schedule Config state
  const [currentRoutine, setCurrentRoutine] = useState<RoutineScheduleConfig>(
    routineConfig || {
      dayOfWeek: 0,
      dayName: "Minggu",
      startTime: "14:00",
      endTime: "16:30",
      location: "Lapangan Utama Pangkalan",
      titleTemplate: "Latihan Rutin Minggu ke-{n}",
      isActive: true,
    }
  );

  // Sheet attendance state: memberId -> status
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA">>(() => {
    const map: Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA"> = {};
    currentRecords.forEach((r) => {
      map[r.memberId] = r.status;
    });
    return map;
  });

  // Sheet notes state: memberId -> notes (alasan izin / sakit)
  const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    currentRecords.forEach((r) => {
      if (r.notes) map[r.memberId] = r.notes;
    });
    return map;
  });

  // Baseline state to detect unsaved changes
  const initialMap = useMemo(() => {
    const map: Record<string, "HADIR" | "IZIN" | "SAKIT" | "ALPA"> = {};
    currentRecords.forEach((r) => {
      map[r.memberId] = r.status;
    });
    return map;
  }, [currentRecords]);

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

  // Schedule filtering & searching
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState<"ALL" | "TERJADWAL" | "SELESAI" | "DIBATALKAN">("ALL");
  const [scheduleSearch, setScheduleSearch] = useState("");

  const filteredMeetings = useMemo(() => {
    return meetings.filter((m) => {
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
  }, [meetings, scheduleStatusFilter, scheduleSearch]);

  // Filter members displayed in current sheet
  const displayedMembers = useMemo(() => {
    let list = members;
    if (mode === "REGU" && selectedReguId) {
      list = list.filter((m) => m.groupId === selectedReguId);
    }
    if (searchMember) {
      const q = searchMember.toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.memberNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [members, mode, selectedReguId, searchMember]);

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
    if (!canEdit) return;
    setAttendanceMap((prev) => ({
      ...prev,
      [memberId]: status,
    }));
    setSaveSuccess(false);

    if ((status === "IZIN" || status === "SAKIT") && !notesMap[memberId]) {
      const m = displayedMembers.find((item) => item.id === memberId);
      if (m) {
        setEditingNoteMember({
          id: memberId,
          name: m.fullName,
          status,
          note: "",
        });
      }
    }
  };

  // Bulk mark all displayed members as HADIR
  const handleMarkAllHadir = () => {
    if (!confirm("Tandai seluruh anggota yang tampil saat ini sebagai HADIR?")) return;
    const nextMap = { ...attendanceMap };
    displayedMembers.forEach((m) => {
      nextMap[m.id] = "HADIR";
    });
    setAttendanceMap(nextMap);
    setSaveSuccess(false);
  };

  // Save attendance sheet to database
  const handleSaveAttendance = async () => {
    if (!activeMeeting) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);

    const records = Object.entries(attendanceMap).map(([memberId, status]) => ({
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
        router.push("/dashboard/attendance");
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
                Presensi & Jadwal Latihan
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Manajemen jadwal latihan mingguan, pencatatan presensi terpadu, dan rekapitulasi kehadiran.
              </p>
            </div>
          </div>
        </div>

        {/* TOP TAB CONTROLS & ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main 3 Tabs */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center text-xs font-bold shadow-2xs border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("SHEET")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === "SHEET"
                  ? "bg-white text-emerald-900 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>Lembar Presensi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SCHEDULE")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === "SCHEDULE"
                  ? "bg-white text-emerald-900 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Kelola Jadwal</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {meetings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("RECAP")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
                activeTab === "RECAP"
                  ? "bg-white text-emerald-900 shadow-xs font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Rekapitulasi</span>
            </button>
          </div>

          {/* Routine & Manual Schedule Action Buttons */}
          {canEdit && !isKetuaRegu && (
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
      {/* TAB 1: LEMBAR PRESENSI (ATTENDANCE SHEET)                                  */}
      {/* ========================================================================= */}
      {activeTab === "SHEET" && (
        <div className="space-y-6">
          {/* Active Meeting Context Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Meeting Dropdown Selector */}
              <div className="flex-1 max-w-xl">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                  Pilih Sesi Latihan Mingguan:
                </label>
                <div className="relative">
                  <select
                    value={activeMeeting?.id || ""}
                    onChange={(e) => handleChangeMeeting(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm font-bold rounded-2xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 bg-slate-50/50 text-slate-900 shadow-2xs"
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {formatDayDate(m.meetingDate)} — {m.title} [{m.status}] ({m.records?.length || 0} Terabsen)
                      </option>
                    ))}
                    {meetings.length === 0 && <option value="">(Belum ada jadwal pertemuan)</option>}
                  </select>
                </div>
              </div>

              {/* Mode Selector (Semua vs Per Regu) */}
              <div>
                {isKetuaRegu ? (
                  <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl">
                    <Shield className="w-5 h-5 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                        Akses Presensi Regu
                      </p>
                      <p className="text-xs font-black text-amber-950">
                        {userGroupName || "Regu Anda"} ({displayedMembers.length} Anggota Terdaftar)
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                      Filter Tampilan:
                    </span>
                    <button
                      type="button"
                      onClick={() => setMode("ALL")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mode === "ALL"
                          ? "bg-emerald-800 text-white shadow-xs font-black"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Semua Anggota ({members.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("REGU")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        mode === "REGU"
                          ? "bg-emerald-800 text-white shadow-xs font-black"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      Pilih Regu
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-selector for Regu if mode is REGU */}
            {!isKetuaRegu && mode === "REGU" && (
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-slate-500 shrink-0">Daftar Regu:</span>
                <button
                  type="button"
                  onClick={() => setSelectedReguId("")}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    !selectedReguId ? "bg-amber-600 text-white font-bold" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Semua Regu
                </button>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedReguId(g.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedReguId === g.id
                        ? "bg-amber-600 text-white font-bold shadow-2xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active Meeting Metadata & Status Details */}
            {activeMeeting ? (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3 text-slate-600">
                  <span className="flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {activeMeeting.startTime || "14:00"} - {activeMeeting.endTime || "16:30"} WIB
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {activeMeeting.location || "Pangkalan"}
                  </span>
                  {activeMeeting.agenda && (
                    <span className="flex items-center gap-1 text-slate-500 truncate max-w-md">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      Materi: {activeMeeting.agenda}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider ${
                      activeMeeting.status === "SELESAI"
                        ? "bg-emerald-100 text-emerald-800"
                        : activeMeeting.status === "DIBATALKAN"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    Status: {activeMeeting.status}
                  </span>

                  {canEdit && !isKetuaRegu && (
                    <button
                      type="button"
                      onClick={() => setEditMeetingModal(activeMeeting)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      Ubah Jadwal
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            {/* CANCELED MEETING WARNING BANNER */}
            {activeMeeting?.status === "DIBATALKAN" && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-black text-sm">PERTEMUAN INI DIBATALKAN</p>
                  <p className="mt-0.5 text-rose-800 leading-relaxed">
                    Sesi latihan ini berstatus dibatalkan ({activeMeeting.notes || "kegiatan ditiadakan"}). Sesuai ketentuan,
                    seluruh presensi pada pertemuan ini <strong>tidak akan dihitung</strong> dalam pembagi persentase rekapitulasi kehadiran anggota.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* REALTIME ATTENDANCE LIVE COUNTERS */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block">Hadir</span>
              <span className="text-2xl sm:text-3xl font-black mt-1 block text-emerald-900">{summary.hadir}</span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                {summary.total > 0 ? Math.round((summary.hadir / summary.total) * 100) : 0}% Anggota
              </span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-950 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 block">Izin</span>
              <span className="text-2xl sm:text-3xl font-black mt-1 block text-blue-900">{summary.izin}</span>
              <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Disertai surat/keterangan</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">Sakit</span>
              <span className="text-2xl sm:text-3xl font-black mt-1 block text-amber-900">{summary.sakit}</span>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Alasan kesehatan</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-950 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 block">Alpa</span>
              <span className="text-2xl sm:text-3xl font-black mt-1 block text-rose-900">{summary.alpa}</span>
              <span className="text-[10px] text-rose-700 font-semibold mt-0.5 block">Tanpa keterangan</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 text-center shadow-2xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">Belum Diisi</span>
              <span className="text-2xl sm:text-3xl font-black mt-1 block text-slate-900">{summary.belum}</span>
              <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">Perlu verifikasi</span>
            </div>
          </div>

          {/* FEEDBACK ALERTS */}
          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">Data absensi berhasil disimpan ke database!</span>
              </div>
              <span className="text-xs text-emerald-700 font-semibold">Tersinkronisasi ke rekapitulasi</span>
            </div>
          )}

          {saveError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-2xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span className="font-bold">{saveError}</span>
            </div>
          )}

          {/* SHEET FILTER & ACTION BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                placeholder="Cari nama anggota atau NISN..."
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-2xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600 bg-white shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllHadir}
                  className="px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  Tandai Semua Hadir
                </button>

                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={handleSaveAttendance}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Simpan Absensi</span>
                </button>
              </div>
            )}
          </div>

          {/* MEMBER ATTENDANCE CARDS (TOUCH-OPTIMIZED) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs divide-y divide-slate-100">
            {displayedMembers.length > 0 ? (
              displayedMembers.map((member) => {
                const currentStatus = attendanceMap[member.id];
                const note = notesMap[member.id];

                return (
                  <div
                    key={member.id}
                    className="p-3.5 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100/70 text-emerald-900 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200/50">
                        {member.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                            {member.fullName}
                          </p>
                          {member.group && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 text-[10px] font-black">
                              {member.group.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {member.memberNumber || "No ID -"} • {member.scoutLevel || "Penggalang"}
                        </p>

                        {/* Note preview if any */}
                        {note && (
                          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-700 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-lg w-fit border border-blue-200/50">
                            <MessageSquare className="w-3 h-3 shrink-0" />
                            <span>Ket: {note}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Touch Status Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 self-end md:self-center">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleSetStatus(member.id, "HADIR")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          currentStatus === "HADIR"
                            ? "bg-emerald-600 text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        H (Hadir)
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleSetStatus(member.id, "IZIN")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          currentStatus === "IZIN"
                            ? "bg-blue-600 text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        I (Izin)
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleSetStatus(member.id, "SAKIT")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          currentStatus === "SAKIT"
                            ? "bg-amber-600 text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        S (Sakit)
                      </button>

                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleSetStatus(member.id, "ALPA")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          currentStatus === "ALPA"
                            ? "bg-rose-600 text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        A (Alpa)
                      </button>

                      {/* Button to add/edit note */}
                      {canEdit && (
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
                          className={`p-2 rounded-xl text-xs transition-colors ${
                            note
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-slate-100 text-slate-400 hover:text-slate-700 hover:bg-slate-200"
                          }`}
                          title="Tambahkan catatan/keterangan izin/sakit"
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
          {hasUnsavedChanges && (
            <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-8 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center justify-between sm:justify-start gap-4 border border-slate-700/80 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold">Perubahan belum disimpan!</span>
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
      {activeTab === "SCHEDULE" && (
        <div className="space-y-6">
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
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            meeting.status === "SELESAI"
                              ? "bg-emerald-100 text-emerald-800"
                              : meeting.status === "DIBATALKAN"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {meeting.status}
                        </span>

                        <span className="text-[11px] font-semibold text-slate-500">
                          {formatDayDate(meeting.meetingDate)}
                        </span>
                      </div>

                      {/* Title & Agenda */}
                      <h4 className="font-black text-sm sm:text-base text-slate-900 mt-2.5 leading-snug">
                        {meeting.title}
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
                        <button
                          type="button"
                          onClick={() => {
                            handleChangeMeeting(meeting.id);
                            setActiveTab("SHEET");
                          }}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-all shadow-2xs"
                        >
                          Buka Presensi
                        </button>

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
      {activeTab === "RECAP" && (
        <div className="space-y-6">
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
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Laporan Rekapitulasi Presensi Anggota
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar akumulasi kehadiran tiap anggota selama periode latihan aktif.
                </p>
              </div>

              {/* Action Buttons: Export CSV & Print */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
              </div>
            </div>

            {/* Filter controls within recap */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
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

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[11px]">
                    <th className="p-3.5 w-12 text-center">No</th>
                    <th className="p-3.5">Nama Lengkap</th>
                    <th className="p-3.5">Regu</th>
                    <th className="p-3.5 text-center text-emerald-700">Hadir</th>
                    <th className="p-3.5 text-center text-blue-700">Izin</th>
                    <th className="p-3.5 text-center text-amber-700">Sakit</th>
                    <th className="p-3.5 text-center text-rose-700">Alpa</th>
                    <th className="p-3.5 text-right">Persentase</th>
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
                          <td className="p-3.5 text-center text-slate-400 font-bold">{idx + 1}</td>
                          <td className="p-3.5">
                            <p className="font-black text-slate-900">{member.fullName}</p>
                            <p className="text-[10px] text-slate-400">{member.memberNumber || "-"}</p>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-600">
                            {member.group?.name || "-"}
                          </td>
                          <td className="p-3.5 text-center font-black text-emerald-700 bg-emerald-50/30">
                            {hCount}
                          </td>
                          <td className="p-3.5 text-center font-black text-blue-700 bg-blue-50/30">
                            {iCount}
                          </td>
                          <td className="p-3.5 text-center font-black text-amber-700 bg-amber-50/30">
                            {sCount}
                          </td>
                          <td className="p-3.5 text-center font-black text-rose-700 bg-rose-50/30">
                            {aCount}
                          </td>
                          <td className="p-3.5 text-right">
                            <span
                              className={`font-black px-2.5 py-1 rounded-lg text-xs ${
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ATUR JADWAL RUTIN MINGGUAN PERMANEN (HARI BERJALAN SETERUSNYA)    */}
      {/* ========================================================================= */}
      {routineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BUAT JADWAL TUNGGAL / KHUSUS                                      */}
      {/* ========================================================================= */}
      {createMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UBAH DATA PERTEMUAN (EDIT MEETING)                                */}
      {/* ========================================================================= */}
      {editMeetingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-150">
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: KONFIRMASI HAPUS PERTEMUAN                                        */}
      {/* ========================================================================= */}
      {deleteMeetingConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-center">
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
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT KETERANGAN / CATATAN ANGGOTA (IZIN / SAKIT)                  */}
      {/* ========================================================================= */}
      {editingNoteMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
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

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Alasan / Catatan (misal: Demam, Acara Keluarga):
              </label>
              <input
                type="text"
                autoFocus
                value={editingNoteMember.note}
                onChange={(e) =>
                  setEditingNoteMember({ ...editingNoteMember, note: e.target.value })
                }
                placeholder="Tuliskan keterangan..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingNoteMember(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
