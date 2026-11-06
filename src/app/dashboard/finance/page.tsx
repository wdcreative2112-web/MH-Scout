import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FinanceClientView } from "./FinanceClientView";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; categoryId?: string; q?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.role !== "ADMIN" && session.role !== "BENDAHARA")) {
    redirect("/dashboard");
  }

  const { type, categoryId, q } = await searchParams;

  let transactions: any[] = [];
  let categories: any[] = [];
  let initialBalance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  try {
    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = categoryId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { sourceOrRecipient: { contains: q, mode: "insensitive" } },
      ];
    }

    const [
      profile,
      cats,
      incomeAgg,
      expenseAgg,
      rawTransactions,
    ] = await Promise.all([
      prisma.organizationProfile.findFirst(),
      prisma.financeCategory.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.financialTransaction.aggregate({
        where: { status: "VALID", type: "PEMASUKAN" },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { status: "VALID", type: "PENGELUARAN" },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.findMany({
        where,
        orderBy: { date: "desc" },
        include: {
          category: true,
          createdBy: true,
        },
      }),
    ]);

    initialBalance = profile?.initialBalance ? Number(profile.initialBalance) : 0;
    totalIncome = Number(incomeAgg._sum.amount || 0);
    totalExpense = Number(expenseAgg._sum.amount || 0);
    categories = JSON.parse(JSON.stringify(cats));

    transactions = JSON.parse(
      JSON.stringify(
        rawTransactions.map((tx) => ({
          ...tx,
          amount: Number(tx.amount),
        }))
      )
    );
  } catch {
    // fallback
  }

  const currentBalance = initialBalance + totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      <FinanceClientView
        transactions={transactions}
        categories={categories}
        initialBalance={initialBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        currentBalance={currentBalance}
        currentFilter={{ type, categoryId, q }}
      />
    </div>
  );
}
