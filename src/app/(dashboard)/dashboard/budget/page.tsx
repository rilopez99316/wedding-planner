import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import BudgetClient from "@/components/dashboard/BudgetClient";
import { initBudgetCategoriesAction } from "@/lib/actions/budget";

export default async function BudgetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await initBudgetCategoriesAction();

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id:          true,
      totalBudget: true,
      budgetCategories: {
        orderBy: { order: "asc" },
        include: {
          items: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!wedding) redirect("/dashboard");

  const totalItems = wedding.budgetCategories.reduce(
    (s, c) => s + c.items.length,
    0
  );

  return (
    <DashboardShell
      heading="Budget"
      subheading={`${wedding.budgetCategories.length} categories · ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
    >
      <BudgetClient
        weddingId={wedding.id}
        totalBudget={wedding.totalBudget}
        categories={wedding.budgetCategories}
      />
    </DashboardShell>
  );
}
