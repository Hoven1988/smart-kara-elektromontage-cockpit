"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";
import { DevFooter } from "@/components/dev-footer";

const FLAT_ITEMS = [
  { href: "/admin/planung", label: "Einsatzplanung" },
  { href: "/admin/zeiten", label: "Zeiten" },
  { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
  { href: "/admin/einstellungen", label: "Einstellungen" },
];

export function AdminSidebarNav({
  clientTree,
  userName,
}: {
  clientTree: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [auftraggeberOpen, setAuftraggeberOpen] = useState(false);

  const isAuftraggeberSection = pathname.startsWith("/admin/kunden") || pathname.startsWith("/admin/auftraege");

  return (
    <>
      <Link
        href="/admin"
        className={`mb-4 rounded px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
          pathname === "/admin" ? "bg-copper text-background" : "text-copper-light hover:bg-card"
        }`}
      >
        KARA Cockpit
      </Link>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2">
        <button
          type="button"
          onClick={() => setAuftraggeberOpen((v) => !v)}
          aria-expanded={auftraggeberOpen}
          className={`flex items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors hover:bg-card ${
            isAuftraggeberSection ? "text-silver-light" : "text-silver"
          }`}
        >
          Auftraggeber
          <span
            className="text-xs transition-transform"
            style={{ transform: auftraggeberOpen ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▸
          </span>
        </button>
        <div className={auftraggeberOpen ? "block" : "hidden"}>{clientTree}</div>

        <div className="my-2 border-t border-border" />

        {FLAT_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded px-3 py-2 text-sm transition-colors hover:bg-card ${
                active ? "text-silver-light" : "text-silver"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-border px-2 pt-3">
        <p className="px-3 py-1 text-xs text-silver">Angemeldet als {userName}</p>
        <LogoutButton variant="link" />
        <div className="mt-2">
          <DevFooter compact />
        </div>
      </div>
    </>
  );
}
