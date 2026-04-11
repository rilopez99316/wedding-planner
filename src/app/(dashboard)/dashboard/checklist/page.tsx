import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ChecklistClient from "@/components/dashboard/ChecklistClient";
import { initChecklistItemsAction } from "@/lib/actions/checklist";
import { CATEGORY_ORDER } from "@/lib/checklist-constants";

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await initChecklistItemsAction();

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      checklistItems: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const total     = wedding.checklistItems.length;
  const completed = wedding.checklistItems.filter((i) => i.completedAt !== null).length;

  return (
    <DashboardShell
      heading="Checklist"
      subheading={`${completed} of ${total} tasks complete`}
    >
      <ChecklistClient
        weddingId={wedding.id}
        items={wedding.checklistItems}
        categoryOrder={CATEGORY_ORDER as unknown as string[]}
      />
    </DashboardShell>
  );
}
