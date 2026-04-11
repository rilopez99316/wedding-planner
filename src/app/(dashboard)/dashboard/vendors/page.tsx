import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import VendorsClient from "@/components/dashboard/VendorsClient";

export default async function VendorsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({ where: { ownerId: session.user.id } });
  if (!wedding) redirect("/onboarding");

  const vendors = await db.vendor.findMany({
    where:   { weddingId: wedding.id },
    include: { packages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <DashboardShell
      heading="Vendors"
      subheading={`${vendors.length} vendor${vendors.length !== 1 ? "s" : ""}`}
    >
      <VendorsClient initialVendors={vendors} />
    </DashboardShell>
  );
}
