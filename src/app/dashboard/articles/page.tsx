import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArticleManagerView } from "./ArticleManagerView";

export const dynamic = "force-dynamic";

export default async function ArticlesDashboardPage() {
  const session = await getSession();

  let articles: any[] = [];
  let categories: any[] = [];
  try {
    const [fetchedArticles, fetchedCategories] = await Promise.all([
      prisma.article.findMany({
        orderBy: { createdAt: "desc" },
        include: { category: true, author: true },
      }),
      prisma.articleCategory.findMany({
        orderBy: { name: "asc" },
      }),
    ]);
    articles = fetchedArticles;
    categories = fetchedCategories;
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <ArticleManagerView
        initialArticles={articles}
        categories={categories}
        canEdit={canEdit}
      />
    </div>
  );
}
