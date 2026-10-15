import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import { ReportsClientView } from "./ReportsClientView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();

  let members: any[] = [];
  let groups: any[] = [];
  let transactions: any[] = [];
  let categories: any[] = [];
  let duesList: any[] = [];
  let initialBalance = 0;

    let organizationProfile: any = null;

    try {
      const profile = await prisma.organizationProfile.findFirst();
      initialBalance = profile?.initialBalance ? Number(profile.initialBalance) : 0;
      if (profile) {
        organizationProfile = {
          name: profile.name,
          pangkalan: profile.pangkalan,
          address: profile.address,
          logoUrl: profile.logoUrl,
        };
      }

    members = await prisma.member.findMany({
      orderBy: { fullName: "asc" },
      include: { group: true },
    });

    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      include: { _count: { select: { members: true } } },
    });

    const rawTransactions = await prisma.financialTransaction.findMany({
      where: { status: "VALID" },
      orderBy: { date: "desc" },
      include: { category: true },
    });
    const rawCategories = await prisma.financeCategory.findMany({
      orderBy: { name: "asc" },
    });
    categories = JSON.parse(JSON.stringify(rawCategories));

    const rawDuesList = await prisma.memberDues.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        duesType: true,
        member: { include: { group: true } },
      },
    });

    members = JSON.parse(JSON.stringify(members));
    groups = JSON.parse(JSON.stringify(groups));

    transactions = JSON.parse(
      JSON.stringify(
        rawTransactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        }))
      )
    );

    duesList = JSON.parse(
      JSON.stringify(
        rawDuesList.map((m) => ({
          ...m,
          amount: Number(m.amount),
          amountPaid: Number(m.amountPaid),
          duesType: m.duesType ? { ...m.duesType, amount: Number(m.duesType.amount) } : null,
        }))
      )
    );
  } catch {
    // fallback
  }

  const isTreasurerOrAdmin = session?.role === "ADMIN" || session?.role === "BENDAHARA";

  return (
    <div className="space-y-6">
      <ReportsClientView
        members={members}
        groups={groups}
        transactions={transactions}
        categories={categories}
        duesList={duesList}
        initialBalance={initialBalance}
        canViewFinance={isTreasurerOrAdmin}
        organizationProfile={organizationProfile}
      />
    </div>
  );
}
