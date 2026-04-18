import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import VendorsClient from "@/components/dashboard/VendorsClient";

export default async function VendorsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({ where: { ownerId: session.user.id } });
  if (!wedding) redirect("/onboarding");

  const vendors = await db.vendor.findMany({
    where:   { weddingId: wedding.id },
    include: {
      packages:    { orderBy: { createdAt: "asc" } },
      documents:   { orderBy: { createdAt: "asc" } },
      payments:    { orderBy: { dueDate: "asc" } },
      meetings:    { orderBy: { date: "desc" } },
      budgetItems: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      heading="Vendors"
      subheading={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
    >
      <VendorsClient initialVendors={vendors} totalBudget={wedding.totalBudget} />
    </DashboardShell>
  );
}
