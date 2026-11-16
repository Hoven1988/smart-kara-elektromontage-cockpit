"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

const NAV_ITEMS = [
  { href: "/", label: "Meine Aufträge" },
  { href: "/zeiten", label: "Meine Zeiten" },
  { href: "/zeiten/neu", label: "Zeit eintragen" },
  { href: "/urlaub", label: "Urlaub" },
];

export function MonteurSidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      <Link
        href="/"
        className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${
          pathname === "/" ? "bg-copper text-background" : "text-copper-light hover:bg-card"
        }`}
      >
        KARA Cockpit
      </Link>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-6 py-3 text-sm transition-colors hover:bg-card ${
                active ? "text-silver-light" : "text-silver"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pb-4">
        <LogoutButton variant="link" />
      </div>
    </div>
  );
}
