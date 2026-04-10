import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header */}
      <header className="h-14 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-semibold">V</span>
          </div>
          <span className="font-semibold text-[15px] text-gray-900">Vows</span>
        </Link>
      </header>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
