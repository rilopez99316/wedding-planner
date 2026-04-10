import PlatformHeader from "@/components/platform/PlatformHeader";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white">
      <PlatformHeader />
      <main>{children}</main>
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
              <span className="text-white text-xs font-semibold">V</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Vows</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Vows. Crafted with love.
          </p>
        </div>
      </footer>
    </div>
  );
}
