import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DuesClientView } from "./DuesClientView";

export const dynamic = "force-dynamic";

export default async function DuesPage() {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
    redirect("/dashboard");
  }

  let duesTypes: any[] = [];
  let memberDuesList: any[] = [];

  try {
    const rawDuesTypes = await prisma.duesType.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    duesTypes = JSON.parse(
      JSON.stringify(
        rawDuesTypes.map((d) => ({
          ...d,
          amount: Number(d.amount),
        }))
      )
    );

    const rawMemberDuesList = await prisma.memberDues.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        duesType: true,
        member: { include: { group: true } },
      },
    });
    memberDuesList = JSON.parse(
      JSON.stringify(
        rawMemberDuesList.map((m) => ({
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

  const canEdit = session?.role === "ADMIN" || session?.role === "BENDAHARA";

  return (
    <div className="space-y-6">
      <DuesClientView duesTypes={duesTypes} memberDuesList={memberDuesList} canEdit={canEdit} />
    </div>
  );
}
