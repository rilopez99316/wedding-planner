import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ChecklistClient from "@/components/dashboard/ChecklistClient";
import { initChecklistItemsAction } from "@/lib/actions/checklist";
import { CATEGORY_ORDER, STALE_TITLES } from "@/lib/checklist-constants";

export default async function ChecklistPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id:          true,
      weddingDate: true,
      checklistItems: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const defaultItems = wedding.checklistItems.filter((i) => !i.isCustom);
  const dayOfItem = defaultItems.find((i) => i.category === "day_of");
  const dateChanged =
    !!dayOfItem &&
    dayOfItem.dueDate?.toISOString().split("T")[0] !==
      wedding.weddingDate.toISOString().split("T")[0];
  const isStale =
    defaultItems.length === 0 ||
    defaultItems.some((i) => STALE_TITLES.has(i.title)) ||
    dateChanged;

  if (isStale) {
    await initChecklistItemsAction(wedding.id, wedding.weddingDate, defaultItems);
    redirect("/dashboard/checklist");
  }

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
