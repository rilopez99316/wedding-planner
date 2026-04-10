"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PlatformHeader() {
  const pathname = usePathname();
  const isMarketing = pathname === "/";

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-14 glass border-b border-gray-200/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-semibold">V</span>
          </div>
          <span className="font-semibold text-[15px] text-gray-900">Vows</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {isMarketing && (
            <>
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it works</a>
            </>
          )}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-150",
              "bg-accent text-white hover:brightness-105 shadow-apple-sm"
            )}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
