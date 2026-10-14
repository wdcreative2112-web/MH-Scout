import React from "react";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LettersClientView } from "./LettersClientView";

export const dynamic = "force-dynamic";

export default async function LettersPage() {
  const session = await getSession();

  let letters: any[] = [];
  try {
    letters = await prisma.letter.findMany({
      orderBy: { date: "desc" },
    });
  } catch {
    // fallback
  }

  const canEdit = session?.role === "ADMIN" || session?.role === "SEKRETARIS";

  return (
    <div className="space-y-6">
      <LettersClientView initialLetters={letters} canEdit={canEdit} />
    </div>
  );
}
