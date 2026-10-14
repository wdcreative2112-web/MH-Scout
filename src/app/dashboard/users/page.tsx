import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UsersClientView } from "./UsersClientView";

export const dynamic = "force-dynamic";

export default async function UsersManagementPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let users: any[] = [];
  let groups: any[] = [];
  try {
    users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    groups = await prisma.scoutGroup.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    const groupMap = new Map(groups.map((g) => [g.id, g]));
    users = users.map((u) => ({
      ...u,
      group: u.groupId ? groupMap.get(u.groupId) || null : null,
    }));
  } catch {
    // fallback
  }

  return (
    <div className="space-y-6">
      <UsersClientView
        initialUsers={JSON.parse(JSON.stringify(users))}
        groups={JSON.parse(JSON.stringify(groups))}
        currentUserId={session.id}
      />
    </div>
  );
}
