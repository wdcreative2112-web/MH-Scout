import React from "react";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PublicGroupsView } from "./PublicGroupsView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Regu & Sangga Kepanduan — Gerakan Pramuka",
  description:
    "Daftar lengkap regu penggalang dan perindukan siaga pangkalan, lengkap dengan pembina pendamping, pemimpin regu (pinru), serta anggota aktif.",
};

export default async function PublicGroupsPage() {
  let profile = null;
  let groups: any[] = [];

  try {
    const [prof, groupList] = await Promise.all([
      prisma.organizationProfile.findFirst({
        select: {
          name: true,
          pangkalan: true,
        },
      }),
      prisma.scoutGroup.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          leader: {
            select: {
              id: true,
              name: true,
              position: true,
              photo: true,
              phone: true,
              nip: true,
            },
          },
          users: {
            where: {
              role: "KETUA_REGU",
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
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
              avatar: true,
            },
          },
          _count: {
            select: { members: { where: { status: "AKTIF" } } },
          },
        },
      }),
    ]);

    profile = prof;
    groups = groupList;
  } catch (err) {
    console.error("Error loading public groups:", err);
  }

  const orgName = profile?.name || "Gugus Depan MH SCOUT";
  const pangkalan = profile?.pangkalan || "Pangkalan Gerakan Pramuka";

  return (
    <PublicGroupsView
      groups={JSON.parse(JSON.stringify(groups))}
      orgName={orgName}
      pangkalan={pangkalan}
    />
  );
}
