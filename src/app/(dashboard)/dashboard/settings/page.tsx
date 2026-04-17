import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import WeddingSettingsForm from "@/components/dashboard/WeddingSettingsForm";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const wedding = await db.wedding.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!wedding) redirect("/dashboard");

  return (
    <DashboardShell
      heading="Wedding Settings"
      subheading="Update your wedding details, venue, and preferences."
    >
      <WeddingSettingsForm
        wedding={{
          partner1Name: wedding.partner1Name,
          partner2Name: wedding.partner2Name,
          weddingDate:  wedding.weddingDate.toISOString().slice(0, 16),
          rsvpDeadline: wedding.rsvpDeadline.toISOString().slice(0, 16),
          venueName:    wedding.venueName ?? "",
          venueAddress: wedding.venueAddress ?? "",
          accentColor:   wedding.accentColor,
          colorPalette:  wedding.colorPalette,
          coverPhotoUrl: wedding.coverPhotoUrl ?? "",
          slug:          wedding.slug,
        }}
      />
    </DashboardShell>
  );
}
