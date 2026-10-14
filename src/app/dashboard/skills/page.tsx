import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SkillsClientView } from "./SkillsClientView";

export const dynamic = "force-dynamic";

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; golongan?: string; memberId?: string }>;
}) {
  const session = await getSession();
  const { type, golongan, memberId } = await searchParams;

  let requirements: any[] = [];
  let members: any[] = [];
  let memberProgress: any[] = [];

  try {
    const whereReq: any = {};
    if (type) whereReq.type = type;
    if (golongan) whereReq.golongan = golongan;

    requirements = await prisma.skillRequirement.findMany({
      where: whereReq,
      orderBy: [{ golongan: "asc" }, { number: "asc" }],
    });

    members = await prisma.member.findMany({
      where: { status: "AKTIF" },
      orderBy: { fullName: "asc" },
      include: { group: true },
    });

    if (session?.role === "KETUA_REGU" && session.groupId) {
      members = members.filter((m) => m.groupId === session.groupId);
    }

    if (memberId) {
      memberProgress = await prisma.memberSkillProgress.findMany({
        where: { memberId },
        include: { requirement: true },
      });
    }
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <SkillsClientView
        requirements={requirements}
        members={members}
        memberProgress={memberProgress}
        selectedMemberId={memberId || ""}
        canEdit={canEdit}
      />
    </div>
  );
}
