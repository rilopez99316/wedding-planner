import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
