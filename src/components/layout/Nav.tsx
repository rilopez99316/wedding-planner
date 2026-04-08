"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/rsvp", label: "RSVP" },
  { href: "/schedule", label: "Schedule" },
  { href: "/registry", label: "Registry" },
];

interface NavProps {
  onLinkClick?: () => void;
}

export default function Nav({ onLinkClick }: NavProps) {
  const pathname = usePathname();

  return (
    <nav>
      <ul className="flex flex-col md:flex-row gap-6 md:gap-8">
        {links.map(({ href, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onLinkClick}
                className={`relative text-sm tracking-widest uppercase font-sans transition-colors duration-200 pb-0.5 ${
                  isActive ? "text-gold" : "text-navy hover:text-gold"
                }`}
              >
                {label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gold" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
