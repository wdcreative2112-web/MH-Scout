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

// ----------------------------------------------------------------------
// STORE (JSON BACKUP / FALLBACK)
// ----------------------------------------------------------------------

function loadStore(): DonationStoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      const initial: DonationStoreData = {
        accounts: [],
        campaigns: [],
        donations: [],
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }

    const content = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      accounts: parsed.accounts || [],
      campaigns: parsed.campaigns || [],
      donations: parsed.donations || [],
    };
  } catch (err) {
    console.warn("Failed to read donation store, using empty state:", err);
    return {
      accounts: [],
      campaigns: [],
      donations: [],
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

// ----------------------------------------------------------------------
// DATA MAPPING HELPERS
// ----------------------------------------------------------------------

export function mapCampaignRecord(c: any): DonationCampaign {
  return {
    id: c.id,
    title: c.title,
    slug: c.slug,
    category: c.category || "Sarana & Prasarana",
    description: c.description || "",
    targetAmount: Number(c.targetAmount || 0),
    collectedAmount: Number(c.collectedAmount || 0),
    donorCount: Number(c.donorCount || 0),
    startDate: c.startDate instanceof Date ? c.startDate.toISOString() : String(c.startDate || new Date().toISOString()),
    endDate: c.endDate ? (c.endDate instanceof Date ? c.endDate.toISOString() : String(c.endDate)) : null,
    coverImage: c.coverImage || null,
    status: (c.status || "ACTIVE") as any,
    isFeatured: Boolean(c.isFeatured),
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt || new Date().toISOString()),
    updatedAt: c.updatedAt ? (c.updatedAt instanceof Date ? c.updatedAt.toISOString() : String(c.updatedAt)) : undefined,
  };
}

export function mapDonationRecord(d: any): Donation {
  let campaignTitle = d.campaignTitle;
  if (!campaignTitle) {
    if (d.campaign && d.campaign.title) {
      campaignTitle = d.campaign.title;
    } else if (!d.campaignId) {
      campaignTitle = "Donasi Umum Pangkalan";
    }
  }

  return {
    id: d.id,
    donationNumber: d.donationNumber,
    campaignId: d.campaignId || null,
    campaignTitle: campaignTitle || null,
    donorName: d.donorName,
    isAnonymous: Boolean(d.isAnonymous),
    donorEmail: d.donorEmail || null,
    donorPhone: d.donorPhone || null,
    amount: Number(d.amount || 0),
    paymentMethod: d.paymentMethod || "TRANSFER_BANK",
    bankName: d.bankName || null,
    proofUrl: d.proofUrl || null,
    status: (d.status || "PENDING") as DonationStatus,
    message: d.message || null,
    verifiedAt: d.verifiedAt ? (d.verifiedAt instanceof Date ? d.verifiedAt.toISOString() : String(d.verifiedAt)) : null,
    verifiedById: d.verifiedById || null,
    rejectionReason: d.rejectionReason || null,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt || new Date().toISOString()),
    updatedAt: d.updatedAt ? (d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt)) : undefined,
  };
}

async function resolveVerifiedById(userId?: string | null): Promise<string | null> {
  if (!userId) return null;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (user) return user.id;

    const fallbackAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    return fallbackAdmin?.id || null;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------
// CAMPAIGNS
// ----------------------------------------------------------------------

export async function getDonationCampaigns(filter?: {
  status?: string;
  category?: string;
  search?: string;
}): Promise<DonationCampaign[]> {
  try {
    const where: any = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.category && filter.category !== "ALL") {
      where.category = filter.category;
    }
    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
      ];
    }

    const campaigns = await prisma.donationCampaign.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    // Database is source of truth: return database result directly
    return campaigns.map(mapCampaignRecord);
  } catch (err) {
    console.warn("Prisma getDonationCampaigns error, using store fallback:", err);
  }

  // Fallback to store ONLY if database query throws an error
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
  try {
    const campaign = await prisma.donationCampaign.findUnique({
      where: { slug },
    });
    return campaign ? mapCampaignRecord(campaign) : null;
  } catch (err) {
    console.warn("Prisma getDonationCampaignBySlug error, using store fallback:", err);
  }

  const store = loadStore();
  return store.campaigns.find((c) => c.slug === slug) || null;
}

export async function getDonationCampaignById(
  id: string
): Promise<DonationCampaign | null> {
  try {
    const campaign = await prisma.donationCampaign.findUnique({
      where: { id },
    });
    return campaign ? mapCampaignRecord(campaign) : null;
  } catch (err) {
    console.warn("Prisma getDonationCampaignById error, using store fallback:", err);
  }

  const store = loadStore();
  return store.campaigns.find((c) => c.id === id) || null;
}

export async function saveDonationCampaign(
  data: Partial<DonationCampaign> & { title: string; targetAmount: number }
): Promise<DonationCampaign> {
  let savedCampaign: DonationCampaign;

  try {
    if (data.id) {
      // Update
      const updated = await prisma.donationCampaign.update({
        where: { id: data.id },
        data: {
          title: data.title,
          category: data.category,
          description: data.description || "",
          targetAmount: Number(data.targetAmount),
          endDate: data.endDate ? new Date(data.endDate) : null,
          coverImage: data.coverImage,
          status: data.status || "ACTIVE",
          isFeatured: data.isFeatured ?? false,
        },
      });
      savedCampaign = mapCampaignRecord(updated);
    } else {
      // Create
      const baseSlug =
        data.slug ||
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
      const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

      const created = await prisma.donationCampaign.create({
        data: {
          title: data.title,
          slug,
          category: data.category || "Sarana & Prasarana",
          description: data.description || "",
          targetAmount: Number(data.targetAmount),
          collectedAmount: 0,
          donorCount: 0,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          coverImage:
            data.coverImage ||
            "https://images.unsplash.com/photo-1510312305653-8ed496efae75?w=1000&auto=format&fit=crop&q=80",
          status: data.status || "ACTIVE",
          isFeatured: data.isFeatured ?? false,
        },
      });
      savedCampaign = mapCampaignRecord(created);
    }
  } catch (dbErr) {
    console.warn("Prisma saveDonationCampaign failed, saving to local store:", dbErr);
    const store = loadStore();
    const now = new Date().toISOString();

    if (data.id) {
      const idx = store.campaigns.findIndex((c) => c.id === data.id);
      if (idx !== -1) {
        savedCampaign = {
          ...store.campaigns[idx],
          ...data,
          targetAmount: Number(data.targetAmount),
          updatedAt: now,
        };
        store.campaigns[idx] = savedCampaign;
      } else {
        savedCampaign = {
          id: data.id,
          title: data.title,
          slug: data.slug || `campaign-${Date.now()}`,
          category: data.category || "Sarana & Prasarana",
          description: data.description || "",
          targetAmount: Number(data.targetAmount),
          collectedAmount: 0,
          donorCount: 0,
          startDate: data.startDate || now,
          endDate: data.endDate || null,
          coverImage: data.coverImage || null,
          status: data.status || "ACTIVE",
          isFeatured: data.isFeatured ?? false,
          createdAt: now,
          updatedAt: now,
        };
        store.campaigns.unshift(savedCampaign);
      }
    } else {
      const id = `camp-${Date.now()}`;
      const slug =
        data.slug ||
        data.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

      savedCampaign = {
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
      store.campaigns.unshift(savedCampaign);
    }
  }

  // Keep local store synchronized
  const store = loadStore();
  const stIdx = store.campaigns.findIndex((c) => c.id === savedCampaign.id);
  if (stIdx !== -1) {
    store.campaigns[stIdx] = savedCampaign;
  } else {
    store.campaigns.unshift(savedCampaign);
  }
  saveStore(store);

  return savedCampaign;
}

export async function deleteDonationCampaign(id: string): Promise<boolean> {
  let dbSuccess = false;
  try {
    await prisma.donationCampaign.delete({
      where: { id },
    });
    dbSuccess = true;
  } catch (err) {
    console.warn("Prisma deleteDonationCampaign notice:", err);
  }

  const store = loadStore();
  store.campaigns = store.campaigns.filter((c) => c.id !== id);
  saveStore(store);

  return dbSuccess || true;
}

// ----------------------------------------------------------------------
// DONATIONS
// ----------------------------------------------------------------------

export async function getDonations(filter?: {
  status?: string;
  campaignId?: string;
  search?: string;
}): Promise<Donation[]> {
  try {
    const where: any = {};
    if (filter?.status && filter.status !== "ALL") {
      where.status = filter.status;
    }
    if (filter?.campaignId && filter.campaignId !== "ALL") {
      where.campaignId = filter.campaignId;
    }
    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { donationNumber: { contains: q, mode: "insensitive" } },
        { donorName: { contains: q, mode: "insensitive" } },
        { donorPhone: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    const donations = await prisma.donation.findMany({
      where,
      include: {
        campaign: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Database is source of truth: return database result directly (even if empty [])
    return donations.map(mapDonationRecord);
  } catch (err) {
    console.warn("Prisma getDonations error, using store fallback:", err);
  }

  // Fallback to store ONLY if database query throws an error
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
  list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return list;
}

export async function getDonationById(id: string): Promise<Donation | null> {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, title: true },
        },
      },
    });
    return donation ? mapDonationRecord(donation) : null;
  } catch (err) {
    console.warn("Prisma getDonationById error, using store fallback:", err);
  }

  const store = loadStore();
  return store.donations.find((d) => d.id === id) || null;
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
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const donationNumber = `DON-${dateStr}-${randomSuffix}`;

  const donorName = data.donorName.trim() || (data.isAnonymous ? "Hamba Allah" : "Donatur");
  const isAnonymous = Boolean(data.isAnonymous);
  const amount = Number(data.amount);

  let savedDonation: Donation;

  try {
    // 1. Simpan langsung ke database PostgreSQL melalui Prisma
    const created = await prisma.donation.create({
      data: {
        donationNumber,
        campaignId: data.campaignId || null,
        donorName,
        isAnonymous,
        donorEmail: data.donorEmail || null,
        donorPhone: data.donorPhone || null,
        amount,
        paymentMethod: data.paymentMethod || "TRANSFER_BANK",
        bankName: data.bankName || null,
        proofUrl: data.proofUrl || null,
        status: "PENDING",
        message: data.message || null,
      },
      include: {
        campaign: {
          select: { id: true, title: true },
        },
      },
    });

    savedDonation = mapDonationRecord(created);
  } catch (dbErr) {
    console.warn("Prisma submitDonation failed, saving to local store:", dbErr);
    let campaignTitle = "Donasi Umum Pangkalan";
    const store = loadStore();
    if (data.campaignId) {
      const camp = store.campaigns.find((c) => c.id === data.campaignId);
      if (camp) campaignTitle = camp.title;
    }

    savedDonation = {
      id: `don-${Date.now()}`,
      donationNumber,
      campaignId: data.campaignId || null,
      campaignTitle,
      donorName,
      isAnonymous,
      donorEmail: data.donorEmail || null,
      donorPhone: data.donorPhone || null,
      amount,
      paymentMethod: data.paymentMethod || "TRANSFER_BANK",
      bankName: data.bankName || null,
      proofUrl: data.proofUrl || null,
      status: "PENDING",
      message: data.message || null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  // Sinkronkan ke store lokal sebagai backup
  const store = loadStore();
  store.donations.unshift(savedDonation);
  saveStore(store);

  return savedDonation;
}

export async function verifyDonation(
  donationId: string,
  verifiedById: string,
  verifiedByName?: string
): Promise<{ success: boolean; donation?: Donation; error?: string }> {
  const actualVerifiedById = await resolveVerifiedById(verifiedById);
  let updatedDonation: Donation | null = null;

  try {
    // 1. Ambil data donasi yang ada di DB
    const existing = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { campaign: true },
    });

    if (existing) {
      if (existing.status === "VERIFIED") {
        return { success: true, donation: mapDonationRecord(existing) };
      }

      // Update status donasi menjadi VERIFIED
      const updated = await prisma.donation.update({
        where: { id: donationId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verifiedById: actualVerifiedById,
          rejectionReason: null,
        },
        include: {
          campaign: {
            select: { id: true, title: true },
          },
        },
      });

      // Update nominal terkumpul dan donor count pada program kampanye
      if (existing.campaignId && existing.campaign) {
        const newCollected = Number(existing.campaign.collectedAmount || 0) + Number(existing.amount);
        const newDonorCount = Number(existing.campaign.donorCount || 0) + 1;
        const target = Number(existing.campaign.targetAmount);
        const newStatus = newCollected >= target ? "COMPLETED" : existing.campaign.status;

        await prisma.donationCampaign.update({
          where: { id: existing.campaignId },
          data: {
            collectedAmount: newCollected,
            donorCount: newDonorCount,
            status: newStatus,
          },
        });
      }

      updatedDonation = mapDonationRecord(updated);
    }
  } catch (dbErr) {
    console.warn("Prisma verifyDonation failed, updating store fallback:", dbErr);
  }

  // Update store lokal
  const store = loadStore();
  const idx = store.donations.findIndex((d) => d.id === donationId);
  if (idx !== -1) {
    const don = store.donations[idx];
    const now = new Date().toISOString();
    don.status = "VERIFIED";
    don.verifiedAt = now;
    don.verifiedById = actualVerifiedById || verifiedById;
    don.rejectionReason = null;
    store.donations[idx] = don;

    if (don.campaignId) {
      const cIdx = store.campaigns.findIndex((c) => c.id === don.campaignId);
      if (cIdx !== -1) {
        store.campaigns[cIdx].collectedAmount =
          Number(store.campaigns[cIdx].collectedAmount || 0) + Number(don.amount);
        store.campaigns[cIdx].donorCount =
          Number(store.campaigns[cIdx].donorCount || 0) + 1;

        if (store.campaigns[cIdx].collectedAmount >= store.campaigns[cIdx].targetAmount) {
          store.campaigns[cIdx].status = "COMPLETED";
        }
      }
    }
    saveStore(store);
    if (!updatedDonation) {
      updatedDonation = don;
    }
  }

  if (!updatedDonation) {
    return { success: false, error: "Data donasi tidak ditemukan." };
  }

  // 2. Sinkronisasikan ke FinancialTransaction (Buku Kas Pemasukan Gugus Depan)
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

    if (catId && actualVerifiedById) {
      const existingTx = await prisma.financialTransaction.findFirst({
        where: { referenceNo: updatedDonation.donationNumber },
      });

      if (!existingTx) {
        await prisma.financialTransaction.create({
          data: {
            referenceNo: updatedDonation.donationNumber,
            date: new Date(),
            type: "PEMASUKAN",
            categoryId: catId,
            amount: updatedDonation.amount,
            title: `Donasi: ${updatedDonation.campaignTitle || "Umum"} (${updatedDonation.isAnonymous ? "Hamba Allah" : updatedDonation.donorName})`,
            sourceOrRecipient: updatedDonation.isAnonymous ? "Hamba Allah" : updatedDonation.donorName,
            description: `Donasi masuk terverifikasi no. ${updatedDonation.donationNumber}. Pesan: ${updatedDonation.message || "-"}`,
            proofUrl: updatedDonation.proofUrl,
            status: "VALID",
            createdById: actualVerifiedById,
          },
        });
      }
    }
  } catch (e) {
    console.warn("Could not sync to FinancialTransaction:", e);
  }

  return { success: true, donation: updatedDonation };
}

export async function rejectDonation(
  donationId: string,
  reason: string,
  verifiedById: string
): Promise<{ success: boolean; donation?: Donation; error?: string }> {
  const actualVerifiedById = await resolveVerifiedById(verifiedById);
  let updatedDonation: Donation | null = null;

  try {
    const updated = await prisma.donation.update({
      where: { id: donationId },
      data: {
        status: "REJECTED",
        rejectionReason: reason || "Bukti transfer tidak sesuai atau tidak valid.",
        verifiedById: actualVerifiedById,
        verifiedAt: new Date(),
      },
      include: {
        campaign: {
          select: { id: true, title: true },
        },
      },
    });
    updatedDonation = mapDonationRecord(updated);
  } catch (err) {
    console.warn("Prisma rejectDonation notice, updating local store:", err);
  }

  const store = loadStore();
  const idx = store.donations.findIndex((d) => d.id === donationId);
  if (idx !== -1) {
    const don = store.donations[idx];
    don.status = "REJECTED";
    don.rejectionReason = reason || "Bukti transfer tidak sesuai atau tidak valid.";
    don.verifiedById = actualVerifiedById || verifiedById;
    don.verifiedAt = new Date().toISOString();
    store.donations[idx] = don;
    saveStore(store);
    if (!updatedDonation) {
      updatedDonation = don;
    }
  }

  if (!updatedDonation) {
    return { success: false, error: "Data donasi tidak ditemukan." };
  }

  return { success: true, donation: updatedDonation };
}

// ----------------------------------------------------------------------
// ACCOUNTS & QRIS
// ----------------------------------------------------------------------

const getPrismaAccount = () => (prisma as any)?.donationAccount;

export function normalizeAccountRecord(a: any): DonationAccount {
  let qr = a.qrImageUrl || null;
  if (typeof qr === "string" && qr.includes("api.qrserver.com")) {
    qr = null;
  }
  return {
    id: a.id,
    bankName: a.bankName,
    accountNumber: a.accountNumber,
    accountHolder: a.accountHolder,
    qrImageUrl: qr,
    description: a.description || null,
    isActive: a.isActive ?? true,
    sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : 0,
  };
}

export async function getDonationAccounts(): Promise<DonationAccount[]> {
  try {
    const delegate = getPrismaAccount();
    if (delegate) {
      const dbAccounts = await delegate.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      });
      return dbAccounts.map(normalizeAccountRecord);
    }
  } catch (err) {
    console.warn("Prisma getDonationAccounts error, using store fallback:", err);
  }

  const store = loadStore();
  return store.accounts
    .map(normalizeAccountRecord)
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
      return dbAccounts.map(normalizeAccountRecord);
    }
  } catch (err) {
    console.warn("Prisma getAllDonationAccountsAdmin error, using store fallback:", err);
  }

  const store = loadStore();
  return store.accounts.map(normalizeAccountRecord).sort((a, b) => a.sortOrder - b.sortOrder);
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
      const syncPrisma = async () => {
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
            (a) => a.id === savedAccount.id || (account.id && a.id === account.id)
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
            (a) => a.id === savedAccount.id || (account.id && a.id === account.id)
          );
          if (stIdx !== -1) {
            store.accounts[stIdx].id = dbAcc.id;
            saveStore(store);
          }
        }
      };

      await Promise.race([
        syncPrisma(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Prisma timeout")), 3500)),
      ]).catch((err) => {
        console.warn("Prisma donationAccount dual-write notice (timed out or skipped):", err?.message || err);
      });
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
  try {
    const [verifiedAgg, pendingAgg, activeCount, totalCampaigns] = await Promise.all([
      prisma.donation.aggregate({
        where: { status: "VERIFIED" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.donation.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.donationCampaign.count({
        where: { status: "ACTIVE" },
      }),
      prisma.donationCampaign.count(),
    ]);

    return {
      totalCollected: Number(verifiedAgg._sum.amount || 0),
      pendingCount: pendingAgg._count.id || 0,
      pendingAmount: Number(pendingAgg._sum.amount || 0),
      totalDonors: verifiedAgg._count.id || 0,
      activeCampaignsCount: activeCount,
      totalCampaignsCount: totalCampaigns,
    };
  } catch (err) {
    console.warn("Prisma getDonationStats error, using store fallback:", err);
  }

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
