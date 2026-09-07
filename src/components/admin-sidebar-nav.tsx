"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";

const FLAT_ITEMS = [
  { href: "/admin/planung", label: "Einsatzplanung" },
  { href: "/admin/zeiten", label: "Zeiten" },
  { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
  { href: "/admin/einstellungen", label: "Einstellungen" },
];

export function AdminSidebarNav({ clientTree }: { clientTree: ReactNode }) {
  const pathname = usePathname();
  const [auftraggeberOpen, setAuftraggeberOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <Link
        href="/admin"
        className={`px-6 py-3 text-sm font-semibold tracking-wide transition-colors ${
          pathname === "/admin" ? "bg-copper text-background" : "text-copper-light hover:bg-card"
        }`}
      >
        KARA Cockpit
      </Link>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={() => setAuftraggeberOpen((v) => !v)}
          aria-expanded={auftraggeberOpen}
          className="flex items-center justify-between px-6 py-3 text-left text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
        >
          Auftraggeber
          <span
            className="text-xs transition-transform"
            style={{ transform: auftraggeberOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▸
          </span>
        </button>
        {auftraggeberOpen && <div className="px-4 pb-1">{clientTree}</div>}

        {FLAT_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
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
