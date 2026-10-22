import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StructureClientView } from "./StructureClientView";
import { DEFAULT_STRUCTURE_TEMPLATE } from "@/lib/structure-constants";

export const dynamic = "force-dynamic";

export default async function ManagementStructurePage() {
  const session = await getSession();
  if (!session) {
    redirect("/dashboard");
  }

  const canEdit = session.role === "ADMIN" || session.role === "SEKRETARIS";

  let structureData: any[] = [];
  let leaders: any[] = [];

  try {
    const [profile, leaderList, groupList] = await Promise.all([
      prisma.organizationProfile.findFirst({
        select: { structure: true },
      }),
      prisma.leader.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        include: {
          groups: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
      prisma.scoutGroup.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          category: true,
          leaderId: true,
        },
      }),
    ]);

    leaders = leaderList;

    const groupMap = new Map(groupList.map((g) => [g.id, g.name]));

    let parsedStructure: any[] | null = null;
    if (profile?.structure) {
      try {
        const parsed = JSON.parse(profile.structure);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedStructure = parsed;
        }
      } catch {}
    }

    if (parsedStructure) {
      // Merge with template to ensure all standard sections are preserved
      const savedMap = new Map(parsedStructure.map((item: any) => [item.id, item]));

      // Migrate existing sec-mabigus to sec-mabigus-ketua if present
      if (savedMap.has("sec-mabigus") && !savedMap.has("sec-mabigus-ketua")) {
        const oldMabigus = savedMap.get("sec-mabigus");
        savedMap.set("sec-mabigus-ketua", { ...oldMabigus, id: "sec-mabigus-ketua" });
      }

      structureData = DEFAULT_STRUCTURE_TEMPLATE.map((tpl) => {
        const existing = savedMap.get(tpl.id);
        if (existing && Array.isArray(existing.members)) {
          const enrichedMembers = existing.members.map((m: any) => {
            // Match with existing leader to preserve photo/phone/groups if missing
            const matchedLeader = leaders.find(
              (l) => l.id === m.id || l.name?.trim().toLowerCase() === m.name?.trim().toLowerCase()
            );

            const groupIds: string[] = Array.isArray(m.groupIds)
              ? m.groupIds
              : matchedLeader?.groups?.map((g: any) => g.id) || [];

            const groupNames = groupIds.map((id) => groupMap.get(id) || id);

            return {
              ...m,
              photo: m.photo || matchedLeader?.photo || null,
              phone: m.phone || matchedLeader?.phone || "",
              nip: m.nip || matchedLeader?.nip || "",
              gender: m.gender || matchedLeader?.gender || "L",
              groupIds,
              groupNames,
            };
          });

          return {
            ...tpl,
            ...existing,
            category: tpl.category,
            title: tpl.title,
            subtitle: tpl.subtitle,
            members: enrichedMembers,
          };
        }
        return tpl;
      });
    } else {
      // First time initialization: automatically populate template with existing leaders
      const templateCopy = JSON.parse(JSON.stringify(DEFAULT_STRUCTURE_TEMPLATE));

      leaders.forEach((lead) => {
        const leadGroupIds = lead.groups?.map((g: any) => g.id) || [];
        const leadGroupNames = leadGroupIds.map((id: string) => groupMap.get(id) || id);

        const memberObj = {
          id: lead.id,
          name: lead.name,
          roleTitle: lead.position || "Pembina Satuan",
          nip: lead.nip || "",
          phone: lead.phone || "",
          gender: lead.gender || (lead.name.toLowerCase().includes("mely") || lead.name.toLowerCase().includes("zulfah") || lead.name.toLowerCase().includes("ulfa") || lead.name.toLowerCase().includes("aisah") || lead.name.toLowerCase().includes("nisa") ? "P" : "L"),
          photo: lead.photo || null,
          groupIds: leadGroupIds,
          groupNames: leadGroupNames,
        };

        const posLower = (lead.position || "").toLowerCase();
        const nameLower = (lead.name || "").toLowerCase();

        if (posLower.includes("mabigus")) {
          templateCopy.find((s: any) => s.id === "sec-mabigus-ketua")?.members.push(memberObj);
        } else if (posLower.includes("gudep") || nameLower.includes("badri")) {
          templateCopy.find((s: any) => s.id === "sec-gudep")?.members.push(memberObj);
        } else if (memberObj.gender === "P") {
          // Putri
          if (leadGroupNames.some((gn: string) => gn.toLowerCase().includes("siaga"))) {
            templateCopy.find((s: any) => s.id === "sec-putri-siaga")?.members.push(memberObj);
          } else {
            templateCopy.find((s: any) => s.id === "sec-putri-penggalang")?.members.push(memberObj);
          }
        } else {
          // Putra
          if (leadGroupNames.some((gn: string) => gn.toLowerCase().includes("siaga"))) {
            templateCopy.find((s: any) => s.id === "sec-putra-siaga")?.members.push(memberObj);
          } else {
            templateCopy.find((s: any) => s.id === "sec-putra-penggalang")?.members.push(memberObj);
          }
        }
      });

      structureData = templateCopy;
    }
  } catch (err) {
    console.error("Error loading structure:", err);
    structureData = DEFAULT_STRUCTURE_TEMPLATE;
  }

  const allAvailableGroups = await prisma.scoutGroup.findMany({
    where: { isActive: true },
    select: { id: true, name: true, category: true },
    orderBy: { name: "asc" },
  }).catch(() => []);

  return (
    <div className="space-y-6">
      <StructureClientView
        initialStructure={JSON.parse(JSON.stringify(structureData))}
        availableLeaders={JSON.parse(JSON.stringify(leaders))}
        availableGroups={JSON.parse(JSON.stringify(allAvailableGroups))}
        canEdit={canEdit}
      />
    </div>
  );
}
