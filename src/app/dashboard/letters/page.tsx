import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LettersClientView } from "./LettersClientView";

export const dynamic = "force-dynamic";

export default async function LettersPage() {
  const session = await getSession();

  let letters: any[] = [];
  let members: any[] = [];
  let activities: any[] = [];
  let leaders: any[] = [];
  let profile = null;

  try {
    const [lList, mList, aList, ldList, prof] = await Promise.all([
      prisma.letter.findMany({
        orderBy: { date: "desc" },
      }),
      prisma.member.findMany({
        where: { status: "AKTIF" },
        include: { group: true },
        orderBy: { fullName: "asc" },
      }),
      prisma.activity.findMany({
        orderBy: { startDate: "desc" },
        take: 30,
      }),
      prisma.leader.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.organizationProfile.findFirst(),
    ]);

    letters = lList;
    members = mList;
    activities = aList;
    leaders = ldList;
    profile = prof
      ? {
          name: prof.name,
          pangkalan: prof.pangkalan,
          address: prof.address,
          phone: prof.phone,
          email: prof.email,
          logoUrl: prof.logoUrl,
        }
      : null;
  } catch {
    // fallback
  }

  const canEdit =
    session?.role === "ADMIN" ||
    session?.role === "SEKRETARIS" ||
    session?.role === "KETUA_REGU";

  return (
    <div className="space-y-6">
      <LettersClientView
        initialLetters={letters}
        canEdit={canEdit}
        members={members}
        activities={activities}
        leaders={leaders}
        organizationProfile={profile}
      />
    </div>
  );
}
