import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SettingsClientView } from "./SettingsClientView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let profile = null;
  try {
    const rawProfile = await prisma.organizationProfile.findFirst();
    if (rawProfile) {
      profile = JSON.parse(
        JSON.stringify({
          ...rawProfile,
          initialBalance: Number(rawProfile.initialBalance),
        })
      );
    }
  } catch {
    // fallback
  }

  return (
    <div className="space-y-6">
      <SettingsClientView profile={profile} />
    </div>
  );
}
