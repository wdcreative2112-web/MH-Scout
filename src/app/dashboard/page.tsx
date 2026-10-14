import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardIndexPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/dashboard/admin");
  } else if (session.role === "SEKRETARIS") {
    redirect("/dashboard/sekretaris");
  } else if (session.role === "KETUA_REGU") {
    redirect("/dashboard/ketua-regu");
  } else {
    redirect("/dashboard/bendahara");
  }
}
