import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ThankYouClient from "@/components/dashboard/ThankYouClient";

export default async function ThankYouPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({ where: { ownerId: session.user.id } });
  if (!wedding) redirect("/onboarding");

  const gifts = await db.gift.findMany({
    where: { weddingId: wedding.id },
    orderBy: { createdAt: "desc" },
  });

  const total = gifts.length;
  const sent = gifts.filter((g) => g.thankYouStatus === "sent").length;
  const pending = total - sent;
  const totalValue = gifts.reduce((s, g) => s + (g.value ?? 0), 0);
  const valueStr = totalValue > 0
    ? ` · $${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })} received`
    : "";

  const subheading =
    total === 0
      ? "Log every gift and keep track of your thank-you notes"
      : sent === total
      ? `All ${total} notes sent${valueStr}`
      : `${sent} of ${total} notes sent · ${pending} pending${valueStr}`;

  return (
    <DashboardShell heading="Thank-You Tracker" subheading={subheading}>
      <ThankYouClient gifts={gifts} />
    </DashboardShell>
  );
}
