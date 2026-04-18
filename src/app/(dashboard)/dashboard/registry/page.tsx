import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import RegistryClient from "@/components/dashboard/RegistryClient";

export default async function RegistryPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      registries: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const registryCount = wedding.registries.filter((r) => r.type === "REGISTRY").length;
  const fundCount = wedding.registries.filter((r) => r.type === "FUND").length;

  const parts: string[] = [];
  if (registryCount > 0) parts.push(`${registryCount} registr${registryCount !== 1 ? "ies" : "y"}`);
  if (fundCount > 0) parts.push(`${fundCount} fund${fundCount !== 1 ? "s" : ""}`);

  return (
    <DashboardShell
      heading="Registry"
      subheading={parts.length > 0 ? parts.join(" · ") : "No entries yet"}
    >
      <RegistryClient registries={wedding.registries} />
    </DashboardShell>
  );
}
