import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GroupsClientView } from "./GroupsClientView";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const session = await getSession();

  let groups: any[] = [];
  let leaders: any[] = [];

  try {
    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        leader: true,
        members: {
          where: { status: "AKTIF" },
          orderBy: { fullName: "asc" },
          select: {
            id: true,
            fullName: true,
            memberNumber: true,
            gender: true,
            scoutLevel: true,
            classGrade: true,
            status: true,
            phone: true,
            avatar: true,
          },
        },
        _count: {
          select: { members: { where: { status: "AKTIF" } } },
        },
      },
    });

    leaders = await prisma.leader.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <GroupsClientView
        initialGroups={JSON.parse(JSON.stringify(groups))}
        leaders={JSON.parse(JSON.stringify(leaders))}
        canEdit={canEdit}
      />
    </div>
  );
}
