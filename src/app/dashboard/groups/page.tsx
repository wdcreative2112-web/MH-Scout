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
      <GroupsClientView initialGroups={groups} leaders={leaders} canEdit={canEdit} />
    </div>
  );
}
