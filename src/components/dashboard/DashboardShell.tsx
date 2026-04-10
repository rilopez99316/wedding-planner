import { ReactNode } from "react";
import Link from "next/link";
import Sidebar from "@/components/dashboard/Sidebar";

interface DashboardShellProps {
  children: ReactNode;
  heading?: string;
  subheading?: string;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function DashboardShell({
  children,
  heading,
  subheading,
  action,
  backHref,
  backLabel,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        {heading && (
          <div className="h-14 border-b border-gray-100 bg-white px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {backHref && (
                <Link
                  href={backHref}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← {backLabel ?? "Back"}
                </Link>
              )}
              <div>
                <h1 className="text-[15px] font-semibold text-gray-900">{heading}</h1>
                {subheading && <p className="text-xs text-gray-400">{subheading}</p>}
              </div>
            </div>
            {action && <div>{action}</div>}
          </div>
        )}
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
