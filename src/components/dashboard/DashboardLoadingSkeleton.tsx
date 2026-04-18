import DashboardShell from "@/components/dashboard/DashboardShell";

export default function DashboardLoadingSkeleton({
  heading,
  rows: _rows = 6,
}: {
  heading?: string;
  rows?: number;
}) {
  return <DashboardShell heading={heading ?? ""} />;
}
