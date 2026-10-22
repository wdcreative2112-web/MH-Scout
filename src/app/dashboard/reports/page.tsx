import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReportsClientView } from "./ReportsClientView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }

  const isTreasurerOrAdmin =
    session.role === "ADMIN" ||
    session.role === "BENDAHARA" ||
    session.role === "SEKRETARIS";

  let members: any[] = [];
  let groups: any[] = [];
  let transactions: any[] = [];
  let categories: any[] = [];
  let duesList: any[] = [];
  let finesList: any[] = [];
  let donationsList: any[] = [];
  let initialBalance = 0;

  let organizationProfile: any = null;
  let signatories = {
    kaGudep: { name: "Pembina Gugus Depan", nip: "" },
    bendahara: { name: session.name || "Bendahara Gugus Depan", nip: "" },
    ketuaMabigus: { name: "Ketua Mabigus", nip: "" },
  };

  try {
    const [
      profile,
      memberList,
      groupList,
      rawTransactions,
      rawCategories,
      rawDuesList,
      rawDonations,
      leadersList,
    ] = await Promise.all([
      prisma.organizationProfile.findFirst(),
      prisma.member.findMany({
        orderBy: { fullName: "asc" },
        include: { group: true },
      }),
      prisma.scoutGroup.findMany({
        where: { isActive: true },
        include: { _count: { select: { members: true } } },
      }),
      prisma.financialTransaction.findMany({
        where: { status: "VALID" },
        orderBy: { date: "desc" },
        include: {
          category: true,
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.financeCategory.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.memberDues.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          duesType: true,
          member: { include: { group: true } },
        },
      }),
      prisma.donation.findMany({
        where: { status: "VERIFIED" },
        orderBy: { createdAt: "desc" },
        include: { campaign: true },
      }),
      prisma.leader.findMany({
        where: { isActive: true },
        select: { id: true, name: true, nip: true, position: true },
      }),
    ]);

    initialBalance = profile?.initialBalance ? Number(profile.initialBalance) : 0;
    if (profile) {
      organizationProfile = {
        name: profile.name,
        pangkalan: profile.pangkalan,
        address: profile.address,
        logoUrl: profile.logoUrl,
        phone: profile.phone,
        email: profile.email,
      };

      if (profile.structure) {
        try {
          const parsed = JSON.parse(profile.structure);
          if (Array.isArray(parsed)) {
            const gudepSec = parsed.find((s: any) => s.id === "sec-gudep");
            if (gudepSec?.members?.[0]?.name) {
              signatories.kaGudep = {
                name: gudepSec.members[0].name,
                nip: gudepSec.members[0].nip || "",
              };
            }

            const bendaharaSec = parsed.find((s: any) => s.id === "sec-bendahara");
            if (bendaharaSec?.members?.[0]?.name) {
              signatories.bendahara = {
                name: bendaharaSec.members[0].name,
                nip: bendaharaSec.members[0].nip || "",
              };
            }

            const mabigusSec = parsed.find(
              (s: any) => s.id === "sec-mabigus-ketua" || s.id === "sec-mabigus"
            );
            if (mabigusSec?.members?.[0]?.name) {
              signatories.ketuaMabigus = {
                name: mabigusSec.members[0].name,
                nip: mabigusSec.members[0].nip || "",
              };
            }
          }
        } catch {}
      }
    }

    // Fallbacks for signatories from leaders table if not set in structure
    if (signatories.kaGudep.name === "Pembina Gugus Depan") {
      const leaderKaGudep = leadersList.find(
        (l) =>
          l.position?.toLowerCase().includes("gudep") ||
          l.position?.toLowerCase().includes("ketua")
      );
      if (leaderKaGudep) {
        signatories.kaGudep = {
          name: leaderKaGudep.name,
          nip: leaderKaGudep.nip || "",
        };
      }
    }

    if (
      signatories.bendahara.name === "Bendahara Gugus Depan" ||
      !signatories.bendahara.name
    ) {
      const leaderBendahara = leadersList.find((l) =>
        l.position?.toLowerCase().includes("bendahara")
      );
      if (leaderBendahara) {
        signatories.bendahara = {
          name: leaderBendahara.name,
          nip: leaderBendahara.nip || "",
        };
      } else if (session.role === "BENDAHARA") {
        signatories.bendahara.name = session.name;
      }
    }

    members = JSON.parse(JSON.stringify(memberList));
    groups = JSON.parse(JSON.stringify(groupList));
    categories = JSON.parse(JSON.stringify(rawCategories));

    transactions = JSON.parse(
      JSON.stringify(
        rawTransactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        }))
      )
    );

    const serializedDues = rawDuesList.map((m) => ({
      ...m,
      amount: Number(m.amount),
      amountPaid: Number(m.amountPaid),
      duesType: m.duesType ? { ...m.duesType, amount: Number(m.duesType.amount) } : null,
    }));

    // Separate regular dues and attendance fines (denda)
    duesList = JSON.parse(
      JSON.stringify(
        serializedDues.filter(
          (d) => d.duesType?.name !== "Denda Absensi (Alpa)"
        )
      )
    );

    finesList = JSON.parse(
      JSON.stringify(
        serializedDues.filter(
          (d) => d.duesType?.name === "Denda Absensi (Alpa)"
        )
      )
    );

    donationsList = JSON.parse(
      JSON.stringify(
        rawDonations.map((don) => ({
          ...don,
          amount: Number(don.amount),
        }))
      )
    );
  } catch (err) {
    console.error("Error loading reports data:", err);
  }

  return (
    <div className="space-y-6">
      <ReportsClientView
        members={members}
        groups={groups}
        transactions={transactions}
        categories={categories}
        duesList={duesList}
        finesList={finesList}
        donationsList={donationsList}
        initialBalance={initialBalance}
        canViewFinance={isTreasurerOrAdmin}
        organizationProfile={organizationProfile}
        signatories={signatories}
      />
    </div>
  );
}
