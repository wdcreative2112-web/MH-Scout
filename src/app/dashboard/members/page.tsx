import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MembersClientView } from "./MembersClientView";

export const dynamic = "force-dynamic";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; regu?: string; tingkatan?: string; status?: string }>;
}) {
  const session = await getSession();
  const { q, regu, tingkatan, status } = await searchParams;

  let members: any[] = [];
  let groups: any[] = [];

  try {
    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const where: any = {};

    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { memberNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const isKetuaRegu = session?.role === "KETUA_REGU";

    if (isKetuaRegu && session?.groupId) {
      where.groupId = session.groupId;
    } else if (regu) {
      where.groupId = regu;
    }

    if (tingkatan) {
      where.scoutLevel = tingkatan;
    }

    if (status) {
      where.status = status;
    }

    members = await prisma.member.findMany({
      where,
      orderBy: [{ status: "asc" }, { fullName: "asc" }],
      include: {
        group: true,
        _count: { select: { attendances: true } },
      },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <MembersClientView
        initialMembers={members}
        groups={groups}
        canEdit={canEdit}
        currentFilter={{ q, regu, tingkatan, status }}
      />
    </div>
  );
}
