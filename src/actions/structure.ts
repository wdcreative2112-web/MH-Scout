"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";

export async function saveStructureAction(structureData: any[]) {
  const session = await requireAuth();
  if (session.role !== "ADMIN" && session.role !== "SEKRETARIS") {
    return { success: false, error: "Akses ditolak. Hanya Admin dan Sekretaris yang dapat mengelola struktur kepengurusan." };
  }

  try {
    // 1. Fetch existing leaders and groups to map and preserve relations
    const [existingLeaders, allGroups] = await Promise.all([
      prisma.leader.findMany({ select: { id: true, name: true, nip: true, phone: true, photo: true } }),
      prisma.scoutGroup.findMany({ select: { id: true, name: true, category: true, leaderId: true } }),
    ]);

    const groupMap = new Map(allGroups.map((g) => [g.id, g.name]));
    const leaderByName = new Map(existingLeaders.map((l) => [l.name.trim().toLowerCase(), l]));
    const leaderById = new Map(existingLeaders.map((l) => [l.id, l]));

    // Track all groups assigned in this structure
    const allAssignedGroupIds = new Set<string>();
    const involvedLeaderIds = new Set<string>();

    // Process all members across sections and sync to Leader table
    const processedStructure = [];

    for (const section of structureData) {
      const sectionTitle = section.title || "Pengurus";
      const processedMembers = [];

      if (Array.isArray(section.members)) {
        for (const member of section.members) {
          const rawName = (member.name || "").trim();
          if (!rawName) continue;

          const groupIds: string[] = Array.isArray(member.groupIds) ? member.groupIds.filter(Boolean) : [];
          groupIds.forEach((gId) => allAssignedGroupIds.add(gId));

          // Find existing leader by ID or Name
          let matchedLeader = (member.id && leaderById.get(member.id)) || leaderByName.get(rawName.toLowerCase());

          let currentLeaderId = matchedLeader?.id;

          const leaderData = {
            name: rawName,
            nip: member.nip?.trim() || null,
            phone: member.phone?.trim() || null,
            photo: member.photo || null,
            gender: member.gender || null,
            position: member.roleTitle?.trim() || sectionTitle,
            isActive: true,
          };

          if (matchedLeader) {
            // Update existing leader
            await prisma.leader.update({
              where: { id: matchedLeader.id },
              data: leaderData,
            });
            currentLeaderId = matchedLeader.id;
          } else {
            // Create new leader in Neon
            const newLeader = await prisma.leader.create({
              data: leaderData,
            });
            currentLeaderId = newLeader.id;
          }

          if (currentLeaderId) {
            involvedLeaderIds.add(currentLeaderId);

            // Assign this leader to their selected groups
            if (groupIds.length > 0) {
              await prisma.scoutGroup.updateMany({
                where: { id: { in: groupIds } },
                data: { leaderId: currentLeaderId },
              });
            }
          }

          const groupNames = groupIds.map((id) => groupMap.get(id) || id);

          processedMembers.push({
            ...member,
            id: currentLeaderId || member.id,
            name: rawName,
            roleTitle: member.roleTitle?.trim() || sectionTitle,
            groupIds,
            groupNames,
          });
        }
      }

      processedStructure.push({
        ...section,
        members: processedMembers,
      });
    }

    // Unassign groups that were previously assigned to these leaders but are no longer in their groupIds
    if (involvedLeaderIds.size > 0) {
      await prisma.scoutGroup.updateMany({
        where: {
          leaderId: { in: Array.from(involvedLeaderIds) },
          id: { notIn: Array.from(allAssignedGroupIds) },
        },
        data: {
          leaderId: null,
        },
      });
    }

    // 2. Save complete JSON structure to OrganizationProfile
    const jsonString = JSON.stringify(processedStructure);

    await prisma.organizationProfile.upsert({
      where: { id: "default" },
      update: {
        structure: jsonString,
      },
      create: {
        id: "default",
        name: "Gugus Depan MH SCOUT",
        structure: jsonString,
      },
    });

    await prisma.auditLog
      .create({
        data: {
          userId: session.id,
          userName: session.name,
          action: "UPDATE_STRUKTUR",
          module: "ORGANISASI",
          details: "Memperbarui susunan struktur kepengurusan dan penugasan pembina satuan",
        },
      })
      .catch(() => {});

    revalidatePath("/dashboard/structure");
    revalidatePath("/dashboard/groups");
    revalidatePath("/dashboard/letters");
    revalidatePath("/profil");
    revalidatePath("/struktur");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Save structure error:", error);
    return { success: false, error: "Gagal menyimpan struktur kepengurusan ke database Neon." };
  }
}
