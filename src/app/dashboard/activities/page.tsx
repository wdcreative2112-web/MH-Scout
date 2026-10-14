import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ActivitiesClientView } from "./ActivitiesClientView";

export const dynamic = "force-dynamic";

export default async function ActivitiesPage() {
  const session = await getSession();

  let activities: any[] = [];
  try {
    activities = await prisma.activity.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { meetings: true, albums: true } },
      },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <ActivitiesClientView initialActivities={activities} canEdit={canEdit} />
    </div>
  );
}
