import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface RoutineScheduleConfig {
  dayOfWeek: number; // 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
  dayName: string;
  startTime: string;
  endTime: string;
  location: string;
  titleTemplate: string;
  isActive: boolean;
}

export const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

const CONFIG_PATH = path.join(process.cwd(), "src", "data", "routine-schedule.json");

const DEFAULT_CONFIG: RoutineScheduleConfig = {
  dayOfWeek: 0, // Default: Minggu
  dayName: "Minggu",
  startTime: "14:00",
  endTime: "16:30",
  location: "Lapangan Utama Pangkalan",
  titleTemplate: "Latihan Rutin",
  isActive: true,
};

let _cachedScheduleConfig: RoutineScheduleConfig | null = null;

export async function getRoutineScheduleConfig(): Promise<RoutineScheduleConfig> {
  if (_cachedScheduleConfig) {
    return _cachedScheduleConfig;
  }
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      _cachedScheduleConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      return _cachedScheduleConfig;
    }
  } catch (err) {
    console.warn("Notice: could not read routine schedule from file, using fallback:", err);
  }
  return DEFAULT_CONFIG;
}

export async function saveRoutineScheduleConfig(
  config: Partial<RoutineScheduleConfig>
): Promise<RoutineScheduleConfig> {
  const current = await getRoutineScheduleConfig();
  const dayOfWeek = typeof config.dayOfWeek === "number" ? config.dayOfWeek : current.dayOfWeek;
  const dayName = DAY_NAMES[dayOfWeek] || current.dayName;

  const updated: RoutineScheduleConfig = {
    ...current,
    ...config,
    dayOfWeek,
    dayName,
  };

  _cachedScheduleConfig = updated;

  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Notice: file system is read-only or could not write schedule config. Using in-memory configuration.");
  }

  return updated;
}

/**
 * Mendapatkan tanggal pertemuan rutin yang relevan (minggu berjalan dan 1 minggu ke depan)
 */
export function getUpcomingRoutineDates(dayOfWeek: number, count: number = 2): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

  // Cari tanggal terdekat berikutnya yang memiliki dayOfWeek yang sama
  let daysUntil = (dayOfWeek - today.getDay() + 7) % 7;

  // Jika hari ini belum hari yang dipilih, tapi dalam 3 hari ke belakang ada hari yang dimaksud (misal kemarin Minggu belum dibuat),
  // kita juga bisa cek. Tapi yang utama adalah tanggal hari H atau terdekat mendatang:
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + daysUntil + i * 7);
    dates.push(d);
  }

  return dates;
}

/**
 * Sinkronisasi otomatis: Membuat sesi pertemuan di database jika belum ada
 * untuk hari rutin yang dikonfigurasi.
 */
export async function syncRoutineMeetings(
  customConfig?: RoutineScheduleConfig
): Promise<{ createdCount: number }> {
  try {
    const config = customConfig || (await getRoutineScheduleConfig());

    if (!config.isActive) {
      return { createdCount: 0 };
    }

    const targetDates = getUpcomingRoutineDates(config.dayOfWeek, 2);
    let createdCount = 0;

    for (const targetDate of targetDates) {
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      const existing = await prisma.attendanceMeeting.findFirst({
        where: {
          meetingDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (!existing) {
        const totalCount = await prisma.attendanceMeeting.count();
        const meetingNumber = totalCount + 1;
        const title = config.titleTemplate.includes("{n}")
          ? config.titleTemplate.replace("{n}", String(meetingNumber))
          : `${config.titleTemplate} (${config.dayName})`;

        await prisma.attendanceMeeting.create({
          data: {
            title,
            meetingDate: targetDate,
            startTime: config.startTime || "14:00",
            endTime: config.endTime || "16:30",
            location: config.location || "Pangkalan",
            status: "TERJADWAL",
          },
        });
        createdCount++;
      }
    }

    return { createdCount };
  } catch (err) {
    console.error("Error syncing routine meetings:", err);
    return { createdCount: 0 };
  }
}
