import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LeadersClientView } from "./LeadersClientView";

export const dynamic = "force-dynamic";

export default async function LeadersPage() {
  const session = await getSession();

  let leaders: any[] = [];
  try {
    leaders = await prisma.leader.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      include: {
        groups: true,
      },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <LeadersClientView initialLeaders={leaders} canEdit={canEdit} />
    </div>
  );
}
