import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import {
  DonationCampaign,
  Donation,
  DonationAccount,
  DonationStatus,
} from "@/types";

const DATA_DIR = path.join(process.cwd(), "src", "data");
const DATA_FILE = path.join(DATA_DIR, "donations.json");

interface DonationStoreData {
  accounts: DonationAccount[];
  campaigns: DonationCampaign[];
  donations: Donation[];
}

const DEFAULT_ACCOUNTS: DonationAccount[] = [
  {
    id: "acc-bsi",
    bankName: "Bank Syariah Indonesia (BSI)",
    accountNumber: "7198234501",
    accountHolder: "PRAMUKA GUGUS DEPAN MH SCOUT",
    description: "Rekening operasional utama kegiatan kepanduan & infak",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "acc-bca",
    bankName: "Bank Central Asia (BCA)",
    accountNumber: "8415209381",
    accountHolder: "BENDAHARA PRAMUKA MH SCOUT",
    description: "Menerima transfer antar bank dan jaringan ATM Bersama",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "acc-mandiri",
    bankName: "Bank Mandiri",
    accountNumber: "1330029871642",
    accountHolder: "PRAMUKA MH SCOUT PANGKALAN",
    description: "Transfer via Mandiri Livin' & Virtual Account",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "acc-qris",
    bankName: "QRIS Nasional (Semua Bank & E-Wallet)",
    accountNumber: "QRIS",
    accountHolder: "PRAMUKA MH SCOUT RESMI",
    qrImageUrl: "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=00020101021126590014ID.GO.PRAMUKA011893600918000000000002030000303UME51440014ID.LINKAJA.WWW02159360091800000005204581453033605802ID5916PRAMUKA+MH+SCOUT6007JAKARTA61051234062070703A016304B184",
    description: "Scan langsung menggunakan GoPay, OVO, Dana, ShopeePay, BCA, Livin, dll",
    isActive: true,
    sortOrder: 4,
  },
];

const DEFAULT_CAMPAIGNS: DonationCampaign[] = [
  {
    id: "camp-1",
    title: "Pengadaan Tenda Dome Regu & Perlengkapan Pioneering",
    slug: "tenda-regu-pioneering",
    category: "Sarana & Prasarana",
    description:
      "Mendukung peremajaan 8 unit tenda regu dan tali temali berkualitas untuk latihan lapangan serta perkemahan besar adik-adik Penggalang dan Penegak.",
    targetAmount: 15000000,
    collectedAmount: 8750000,
    donorCount: 24,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1000&auto=format&fit=crop&q=80",
    status: "ACTIVE",
    isFeatured: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camp-2",
    title: "Beasiswa Seragam & Pembinaan Anggota Yatim/Dhuafa",
    slug: "beasiswa-seragam-pramuka-dhuafa",
    category: "Beasiswa & Pembinaan",
    description:
      "Memberikan bantuan seragam lengkap, atribut kepramukaan, dan biaya kegiatan perkemahan bagi adik-adik pramuka berprestasi dari keluarga prasejahtera.",
    targetAmount: 10000000,
    collectedAmount: 6400000,
    donorCount: 19,
    startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1000&auto=format&fit=crop&q=80",
    status: "ACTIVE",
    isFeatured: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camp-3",
    title: "Renovasi Sanggar Bakti & Inventaris Audio Lapangan",
    slug: "renovasi-sanggar-bakti",
    category: "Sarana & Prasarana",
    description:
      "Perbaikan rak penyimpanan perlengkapan, meja administrasi sekretariat, serta pengadaan sound system portabel untuk upacara dan latihan baris-berbaris.",
    targetAmount: 12000000,
    collectedAmount: 4200000,
    donorCount: 12,
    startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1000&auto=format&fit=crop&q=80",
    status: "ACTIVE",
    isFeatured: false,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "camp-4",
    title: "Aksi Bakti Sosial & Penanaman 500 Bibit Pohon",
    slug: "bakti-sosial-penanaman-pohon",
    category: "Sosial & Bencana",
    description:
      "Program pengabdian masyarakat adik-adik pramuka untuk penghijauan lingkungan bantaran sungai dan penyaluran sembako kepada warga sekitar pangkalan.",
    targetAmount: 8000000,
    collectedAmount: 8250000,
    donorCount: 31,
    startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    coverImage: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1000&auto=format&fit=crop&q=80",
    status: "COMPLETED",
    isFeatured: false,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_DONATIONS: Donation[] = [
  {
    id: "don-001",
    donationNumber: "DON-20261012-001",
    campaignId: "camp-1",
    campaignTitle: "Pengadaan Tenda Dome Regu & Perlengkapan Pioneering",
    donorName: "Kak Bambang Prasetyo",
    isAnonymous: false,
    donorEmail: "bambang.pr@gmail.com",
    donorPhone: "081288991122",
    amount: 1000000,
    paymentMethod: "TRANSFER_BANK",
    bankName: "Bank Syariah Indonesia (BSI)",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    status: "VERIFIED",
    message: "Semoga barokah dan bermanfaat untuk latihan adik-adik di perkemahan. Salam Pramuka!",
    verifiedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    verifiedById: "admin",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "don-002",
    donationNumber: "DON-20261013-002",
    campaignId: "camp-2",
    campaignTitle: "Beasiswa Seragam & Pembinaan Anggota Yatim/Dhuafa",
    donorName: "Hamba Allah",
    isAnonymous: true,
    donorEmail: null,
    donorPhone: "085711223344",
    amount: 500000,
    paymentMethod: "QRIS",
    bankName: "QRIS Nasional",
    status: "VERIFIED",
    message: "Untuk adik-adik pramuka yang bersemangat menggapai Pramuka Garuda.",
    verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    verifiedById: "admin",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "don-003",
    donationNumber: "DON-20261014-003",
    campaignId: "camp-1",
    campaignTitle: "Pengadaan Tenda Dome Regu & Perlengkapan Pioneering",
    donorName: "Alumni Pramuka Angkatan 2018",
    isAnonymous: false,
    donorEmail: "alumni2018@gmail.com",
    donorPhone: "081399887766",
    amount: 1500000,
    paymentMethod: "TRANSFER_BANK",
    bankName: "Bank Central Asia (BCA)",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    status: "VERIFIED",
    message: "Bakti dari kami alumni untuk pangkalan tercinta. Jayalah MH SCOUT!",
    verifiedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    verifiedById: "admin",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "don-004",
    donationNumber: "DON-20261015-004",
    campaignId: null,
    campaignTitle: "Donasi Umum Pengembangan Gugus Depan",
    donorName: "Ibu Hj. Ratna Juwita",
    isAnonymous: false,
    donorEmail: "ratna.juwita@yahoo.com",
    donorPhone: "081277665544",
    amount: 250000,
    paymentMethod: "QRIS",
    bankName: "QRIS",
    proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
    status: "PENDING",
    message: "Mohon diterima sumbangan sederhana kami untuk kegiatan adik-adik.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

// Helper to ensure file exists and load
function loadStore(): DonationStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initial: DonationStoreData = {
        accounts: DEFAULT_ACCOUNTS,
        campaigns: DEFAULT_CAMPAIGNS,
        donations: DEFAULT_DONATIONS,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }

    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      accounts: parsed.accounts || DEFAULT_ACCOUNTS,
      campaigns: parsed.campaigns || DEFAULT_CAMPAIGNS,
      donations: parsed.donations || DEFAULT_DONATIONS,
    };
  } catch (err) {
    console.warn("Failed to read donation store, using defaults:", err);
    return {
      accounts: DEFAULT_ACCOUNTS,
      campaigns: DEFAULT_CAMPAIGNS,
      donations: DEFAULT_DONATIONS,
    };
  }
}

function saveStore(data: DonationStoreData): boolean {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write donation store:", err);
    return false;
  }
}

// Check if Prisma has donationCampaign model ready
async function canUsePrisma(): Promise<boolean> {
  try {
    if ((prisma as any).donationCampaign && typeof (prisma as any).donationCampaign.findMany === "function") {
      await (prisma as any).donationCampaign.findFirst();
      return true;
    }
  } catch {
    // Model not yet migrated in DB
  }
  return false;
}

// ----------------------------------------------------------------------
// CAMPAIGNS
// ----------------------------------------------------------------------

export async function getDonationCampaigns(filter?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<DonationCampaign[]> {
  const store = loadStore();
  let list = [...store.campaigns];

  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((c) => c.status === filter.status);
  }
  if (filter?.category && filter.category !== "ALL") {
    list = list.filter((c) => c.category === filter.category);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }

  return list;
}

export async function getDonationCampaignBySlug(
  slug: string
): Promise<DonationCampaign | null> {
  const store = loadStore();
  const found = store.campaigns.find((c) => c.slug === slug);
  return found || null;
}

export async function getDonationCampaignById(
  id: string
): Promise<DonationCampaign | null> {
  const store = loadStore();
  const found = store.campaigns.find((c) => c.id === id);
  return found || null;
}

export async function saveDonationCampaign(
  data: Partial<DonationCampaign> & { title: string; targetAmount: number }
): Promise<DonationCampaign> {
  const store = loadStore();
  const now = new Date().toISOString();

  if (data.id) {
    // Update
    const idx = store.campaigns.findIndex((c) => c.id === data.id);
    if (idx !== -1) {
      const updated: DonationCampaign = {
        ...store.campaigns[idx],
        ...data,
        targetAmount: Number(data.targetAmount),
        updatedAt: now,
      };
      store.campaigns[idx] = updated;
      saveStore(store);
      return updated;
    }
  }

  // Create
  const id = `camp-${Date.now()}`;
  const slug =
    data.slug ||
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const newCampaign: DonationCampaign = {
    id,
    title: data.title,
    slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
    category: data.category || "Sarana & Prasarana",
    description: data.description || "",
    targetAmount: Number(data.targetAmount),
    collectedAmount: 0,
    donorCount: 0,
    startDate: data.startDate || now,
    endDate: data.endDate || null,
    coverImage:
      data.coverImage ||
      "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1000&auto=format&fit=crop&q=80",
    status: data.status || "ACTIVE",
    isFeatured: data.isFeatured ?? false,
    createdAt: now,
    updatedAt: now,
  };

  store.campaigns.unshift(newCampaign);
  saveStore(store);
  return newCampaign;
}

export async function deleteDonationCampaign(id: string): Promise<boolean> {
  const store = loadStore();
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  return saveStore(store);
}

// ----------------------------------------------------------------------
// DONATIONS
// ----------------------------------------------------------------------

export async function getDonations(filter?: {
  status?: string;
  campaignId?: string;
  search?: string;
}): Promise<Donation[]> {
  const store = loadStore();
  let list = [...store.donations];

  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((d) => d.status === filter.status);
  }
  if (filter?.campaignId && filter.campaignId !== "ALL") {
    list = list.filter((d) => d.campaignId === filter.campaignId);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.donationNumber.toLowerCase().includes(q) ||
        d.donorName.toLowerCase().includes(q) ||
        (d.donorPhone && d.donorPhone.includes(q)) ||
        (d.message && d.message.toLowerCase().includes(q))
    );
  }

  // Sort newest first
  list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return list;
}

export async function getDonationById(id: string): Promise<Donation | null> {
  const store = loadStore();
  const found = store.donations.find((d) => d.id === id);
  return found || null;
}

export async function submitDonation(data: {
  campaignId?: string | null;
  donorName: string;
  isAnonymous?: boolean;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amount: number;
  paymentMethod: string;
  bankName?: string | null;
  proofUrl?: string | null;
  message?: string | null;
}): Promise<Donation> {
  const store = loadStore();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const donationNumber = `DON-${dateStr}-${randomSuffix}`;

  let campaignTitle = "Donasi Umum Pangkalan";
  if (data.campaignId) {
    const camp = store.campaigns.find((c) => c.id === data.campaignId);
    if (camp) campaignTitle = camp.title;
  }

  const newDonation: Donation = {
    id: `don-${Date.now()}`,
    donationNumber,
    campaignId: data.campaignId || null,
    campaignTitle,
    donorName: data.donorName.trim() || (data.isAnonymous ? "Hamba Allah" : "Donatur Pramuka"),
    isAnonymous: Boolean(data.isAnonymous),
    donorEmail: data.donorEmail || null,
    donorPhone: data.donorPhone || null,
    amount: Number(data.amount),
    paymentMethod: data.paymentMethod || "TRANSFER_BANK",
    bankName: data.bankName || null,
    proofUrl: data.proofUrl || null,
    status: "PENDING",
    message: data.message || null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  store.donations.unshift(newDonation);
  saveStore(store);

  return newDonation;
}

export async function verifyDonation(
  donationId: string,
  verifiedById: string,
  verifiedByName?: string
): Promise<{ success: boolean; donation?: Donation; error?: string }> {
  const store = loadStore();
  const idx = store.donations.findIndex((d) => d.id === donationId);
  if (idx === -1) {
    return { success: false, error: "Data donasi tidak ditemukan." };
  }

  const don = store.donations[idx];
  if (don.status === "VERIFIED") {
    return { success: true, donation: don };
  }

  const now = new Date().toISOString();
  don.status = "VERIFIED";
  don.verifiedAt = now;
  don.verifiedById = verifiedById;
  don.rejectionReason = null;
  store.donations[idx] = don;

  // Increment campaign collected amount and donor count
  if (don.campaignId) {
    const cIdx = store.campaigns.findIndex((c) => c.id === don.campaignId);
    if (cIdx !== -1) {
      store.campaigns[cIdx].collectedAmount =
        Number(store.campaigns[cIdx].collectedAmount || 0) + Number(don.amount);
      store.campaigns[cIdx].donorCount =
        Number(store.campaigns[cIdx].donorCount || 0) + 1;
      
      // Auto complete campaign if target reached
      if (store.campaigns[cIdx].collectedAmount >= store.campaigns[cIdx].targetAmount) {
        store.campaigns[cIdx].status = "COMPLETED";
      }
    }
  }

  saveStore(store);

  // Synchronize to FinancialTransaction if Prisma is accessible
  try {
    const cat = await prisma.financeCategory.findFirst({
      where: {
        type: "PEMASUKAN",
        name: { contains: "Donasi", mode: "insensitive" },
      },
    });

    let catId = cat?.id;
    if (!catId) {
      const anyIncomeCat = await prisma.financeCategory.findFirst({
        where: { type: "PEMASUKAN" },
      });
      catId = anyIncomeCat?.id;
    }

    if (catId) {
      await prisma.financialTransaction.create({
        data: {
          referenceNo: don.donationNumber,
          date: new Date(),
          type: "PEMASUKAN",
          categoryId: catId,
          amount: don.amount,
          title: `Donasi: ${don.campaignTitle || "Umum"} (${don.isAnonymous ? "Hamba Allah" : don.donorName})`,
          sourceOrRecipient: don.isAnonymous ? "Hamba Allah" : don.donorName,
          description: `Donasi masuk terverifikasi no. ${don.donationNumber}. Pesan: ${don.message || "-"}`,
          proofUrl: don.proofUrl,
          status: "VALID",
          createdById: verifiedById,
        },
      });
    }
  } catch (e) {
    // Keep donation verification intact even if financial sync is offline
    console.warn("Could not sync to FinancialTransaction:", e);
  }

  return { success: true, donation: don };
}

export async function rejectDonation(
  donationId: string,
  reason: string,
  verifiedById: string
): Promise<{ success: boolean; donation?: Donation; error?: string }> {
  const store = loadStore();
  const idx = store.donations.findIndex((d) => d.id === donationId);
  if (idx === -1) {
    return { success: false, error: "Data donasi tidak ditemukan." };
  }

  const don = store.donations[idx];
  don.status = "REJECTED";
  don.rejectionReason = reason || "Bukti transfer tidak sesuai atau tidak valid.";
  don.verifiedById = verifiedById;
  don.verifiedAt = new Date().toISOString();
  store.donations[idx] = don;
  saveStore(store);

  return { success: true, donation: don };
}

// ----------------------------------------------------------------------
// ACCOUNTS & QRIS
// ----------------------------------------------------------------------

// Helper aman untuk Prisma delegate donationAccount (fleksibel jika prisma client belum dire-generate)
const getPrismaAccount = () => (prisma as any)?.donationAccount;

export async function getDonationAccounts(): Promise<DonationAccount[]> {
  try {
    const delegate = getPrismaAccount();
    if (delegate) {
      const dbAccounts = await delegate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      if (dbAccounts && dbAccounts.length > 0) {
        return dbAccounts.map((a: any) => ({
          id: a.id,
          bankName: a.bankName,
          accountNumber: a.accountNumber,
          accountHolder: a.accountHolder,
          qrImageUrl: a.qrImageUrl,
          description: a.description,
          isActive: a.isActive,
          sortOrder: a.sortOrder,
        }));
      }
    }
  } catch {
    // fallback to store
  }

  const store = loadStore();
  return store.accounts
    .filter((a) => a.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getAllDonationAccountsAdmin(): Promise<DonationAccount[]> {
  try {
    const delegate = getPrismaAccount();
    if (delegate) {
      const dbAccounts = await delegate.findMany({
        orderBy: { sortOrder: "asc" },
      });
      if (dbAccounts && dbAccounts.length > 0) {
        return dbAccounts.map((a: any) => ({
          id: a.id,
          bankName: a.bankName,
          accountNumber: a.accountNumber,
          accountHolder: a.accountHolder,
          qrImageUrl: a.qrImageUrl,
          description: a.description,
          isActive: a.isActive,
          sortOrder: a.sortOrder,
        }));
      }
    }
  } catch {
    // fallback to store
  }

  const store = loadStore();
  return store.accounts.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveDonationAccount(
  account: Partial<DonationAccount> & {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }
): Promise<DonationAccount> {
  const store = loadStore();
  let savedAccount: DonationAccount;

  // 1. Simpan di store file lokal
  if (account.id) {
    const idx = store.accounts.findIndex((a) => a.id === account.id);
    if (idx !== -1) {
      savedAccount = {
        ...store.accounts[idx],
        ...account,
      };
      store.accounts[idx] = savedAccount;
    } else {
      savedAccount = {
        id: account.id,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        qrImageUrl: account.qrImageUrl || null,
        description: account.description || null,
        isActive: account.isActive ?? true,
        sortOrder: account.sortOrder ?? store.accounts.length + 1,
      };
      store.accounts.push(savedAccount);
    }
  } else {
    savedAccount = {
      id: `acc-${Date.now()}`,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      qrImageUrl: account.qrImageUrl || null,
      description: account.description || null,
      isActive: account.isActive ?? true,
      sortOrder: account.sortOrder ?? store.accounts.length + 1,
    };
    store.accounts.push(savedAccount);
  }

  saveStore(store);

  // 2. Dual-write sinkronisasi ke Prisma PostgreSQL database
  try {
    const delegate = getPrismaAccount();
    if (delegate) {
      let existingDb: any = null;
      if (account.id) {
        existingDb = await delegate.findUnique({
          where: { id: account.id },
        }).catch(() => null);
      }
      if (!existingDb && account.accountNumber) {
        existingDb = await delegate.findFirst({
          where: { accountNumber: account.accountNumber },
        }).catch(() => null);
      }

      if (existingDb) {
        const dbAcc = await delegate.update({
          where: { id: existingDb.id },
          data: {
            bankName: savedAccount.bankName,
            accountNumber: savedAccount.accountNumber,
            accountHolder: savedAccount.accountHolder,
            qrImageUrl: savedAccount.qrImageUrl,
            description: savedAccount.description,
            isActive: savedAccount.isActive,
            sortOrder: savedAccount.sortOrder,
          },
        });
        savedAccount.id = dbAcc.id;
        const stIdx = store.accounts.findIndex(
          (a) => a.accountNumber === savedAccount.accountNumber || a.id === account.id
        );
        if (stIdx !== -1) {
          store.accounts[stIdx].id = dbAcc.id;
          saveStore(store);
        }
      } else {
        const dbAcc = await delegate.create({
          data: {
            bankName: savedAccount.bankName,
            accountNumber: savedAccount.accountNumber,
            accountHolder: savedAccount.accountHolder,
            qrImageUrl: savedAccount.qrImageUrl,
            description: savedAccount.description,
            isActive: savedAccount.isActive,
            sortOrder: savedAccount.sortOrder,
          },
        });
        savedAccount.id = dbAcc.id;
        const stIdx = store.accounts.findIndex(
          (a) => a.accountNumber === savedAccount.accountNumber || a.id === account.id
        );
        if (stIdx !== -1) {
          store.accounts[stIdx].id = dbAcc.id;
          saveStore(store);
        }
      }
    }
  } catch (dbErr) {
    console.warn("Prisma donationAccount dual-write notice:", dbErr);
  }

  return savedAccount;
}

export async function deleteDonationAccount(id: string): Promise<boolean> {
  const store = loadStore();
  store.accounts = store.accounts.filter((a) => a.id !== id);
  saveStore(store);

  try {
    const delegate = getPrismaAccount();
    if (delegate) {
      await delegate.delete({
        where: { id },
      });
    }
  } catch {
    // abaikan jika tidak ada di DB
  }

  return true;
}

// ----------------------------------------------------------------------
// STATS
// ----------------------------------------------------------------------

export async function getDonationStats() {
  const store = loadStore();
  const verified = store.donations.filter((d) => d.status === "VERIFIED");
  const pending = store.donations.filter((d) => d.status === "PENDING");
  const activeCampaigns = store.campaigns.filter((c) => c.status === "ACTIVE");

  const totalCollected = verified.reduce((sum, d) => sum + Number(d.amount), 0);
  const pendingAmount = pending.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalDonors = verified.length;

  return {
    totalCollected,
    pendingCount: pending.length,
    pendingAmount,
    totalDonors,
    activeCampaignsCount: activeCampaigns.length,
    totalCampaignsCount: store.campaigns.length,
  };
}
