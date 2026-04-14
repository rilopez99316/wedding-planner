"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import Badge from "@/components/ui/Badge";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function Icon({ path }: { path: string }) {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

const navSections: NavSection[] = [
  {
    title: "",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      },
    ],
  },
  {
    title: "Guests & RSVP",
    items: [
      {
        label: "Guest List",
        href: "/dashboard/guests",
        icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
      },
      {
        label: "Invitations",
        href: "/dashboard/invitations",
        icon: <Icon path="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      },
      {
        label: "RSVP Responses",
        href: "/dashboard/responses",
        icon: <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        label: "Seating Chart",
        href: "/dashboard/seating",
        icon: <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
        comingSoon: true,
      },
    ],
  },
  {
    title: "Planning",
    items: [
      {
        label: "Checklist",
        href: "/dashboard/checklist",
        icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
      },
      {
        label: "Budget",
        href: "/dashboard/budget",
        icon: <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        label: "Vendors",
        href: "/dashboard/vendors",
        icon: <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      },
      {
        label: "Wedding Party",
        href: "/dashboard/wedding-party",
        icon: <Icon path="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
      },
    ],
  },
  {
    title: "Your Day",
    items: [
      {
        label: "Day-Of Timeline",
        href: "/dashboard/timeline",
        icon: <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        label: "Ceremony",
        href: "/dashboard/ceremony",
        icon: <Icon path="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />,
      },
      {
        label: "Accommodations",
        href: "/dashboard/accommodations",
        icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
        comingSoon: true,
      },
    ],
  },
  {
    title: "Guests",
    items: [
      {
        label: "Registry",
        href: "/dashboard/registry",
        icon: <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      },
      {
        label: "Communications",
        href: "/dashboard/communications",
        icon: <Icon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
        comingSoon: true,
      },
    ],
  },
  {
    title: "After",
    items: [
      {
        label: "Thank-You Tracker",
        href: "/dashboard/thank-you",
        icon: <Icon path="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
        comingSoon: true,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 border-r border-gray-100 bg-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-semibold">V</span>
          </div>
          <span className="font-semibold text-[15px] text-gray-900">Vows</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title || "main"}>
            {section.title && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.comingSoon ? "#" : item.href}
                  onClick={item.comingSoon ? (e) => e.preventDefault() : undefined}
                  className={cn(
                    "nav-item",
                    isActive(item.href) && !item.comingSoon && "nav-item-active",
                    item.comingSoon && "opacity-50 cursor-default"
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.comingSoon && <Badge variant="coming-soon">Soon</Badge>}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link */}
      <div className="border-t border-gray-100 p-3">
        <Link
          href="/dashboard/settings"
          className={cn("nav-item", pathname.startsWith("/dashboard/settings") && "nav-item-active")}
        >
          <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
