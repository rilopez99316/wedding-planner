import DashboardShell from "@/components/dashboard/DashboardShell";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: string;
}

export default function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <DashboardShell heading={title}>
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="text-5xl mb-6">{icon}</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 bg-accent-light text-accent text-xs font-semibold px-4 py-2 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Coming soon
        </div>
      </div>
    </DashboardShell>
  );
}
