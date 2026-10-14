import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsManagerView } from "./NewsManagerView";

export const dynamic = "force-dynamic";

export default async function NewsDashboardPage() {
  const session = await getSession();

  let news: any[] = [];
  let categories: any[] = [];
  try {
    news = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true, author: true },
    });
    categories = await prisma.newsCategory.findMany({
      orderBy: { name: "asc" },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <NewsManagerView initialNews={news} categories={categories} canEdit={canEdit} />
    </div>
  );
}
