"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";

const PERSONAL_ITEMS = [
  { href: "/admin/planung", label: "Einsatzplanung" },
  { href: "/admin/zeiten", label: "Zeiten" },
  { href: "/admin/urlaub", label: "Urlaub" },
  { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
];

const FINANZEN_ITEMS = [{ href: "/admin/gewerbesteuer", label: "Gewerbesteuer" }];

const FLAT_ITEMS = [{ href: "/admin/einstellungen", label: "Einstellungen" }];

function NavGroup({
  label,
  open,
  onToggle,
  items,
  pathname,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  items: Array<{ href: string; label: string }>;
  pathname: string;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center justify-between px-6 py-3 text-left text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
      >
        {label}
        <span
          className="text-xs transition-transform"
          style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▸
        </span>
      </button>
      {open && (
        <div className="flex flex-col">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-10 py-2.5 text-sm transition-colors hover:bg-card ${
                  active ? "text-silver-light" : "text-silver"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

export function AdminSidebarNav({ clientTree }: { clientTree: ReactNode }) {
  const pathname = usePathname();
  const [auftraggeberOpen, setAuftraggeberOpen] = useState(false);
  const [personalOpen, setPersonalOpen] = useState(() =>
    PERSONAL_ITEMS.some((item) => pathname.startsWith(item.href))
  );
  const [finanzenOpen, setFinanzenOpen] = useState(() =>
    FINANZEN_ITEMS.some((item) => pathname.startsWith(item.href))
  );

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

        <NavGroup
          label="Personal"
          open={personalOpen}
          onToggle={() => setPersonalOpen((v) => !v)}
          items={PERSONAL_ITEMS}
          pathname={pathname}
        />

        <NavGroup
          label="Liquidität & Finanzen"
          open={finanzenOpen}
          onToggle={() => setFinanzenOpen((v) => !v)}
          items={FINANZEN_ITEMS}
          pathname={pathname}
        />

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
