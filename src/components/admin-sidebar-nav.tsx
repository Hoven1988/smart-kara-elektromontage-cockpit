"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogoutButton } from "@/components/logout-button";

const PERSONAL_ITEMS = [
  { href: "/admin/arbeitszeit", label: "Meine Arbeitszeit" },
  { href: "/admin/planung", label: "Einsatzplanung" },
  { href: "/admin/zeiten", label: "Zeiten" },
  { href: "/admin/urlaub", label: "Urlaub" },
  { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
];

const FINANZEN_ITEMS = [{ href: "/admin/gewerbesteuer", label: "Gewerbesteuer" }];

const FLAT_ITEMS = [
  { href: "/admin/kalender", label: "Kalender" },
  { href: "/admin/fuhrpark", label: "Fuhrpark" },
  { href: "/admin/einstellungen", label: "Einstellungen" },
];

function NavGroup({
  label,
  open,
  onToggle,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  items: Array<{ href: string; label: string }>;
  pathname: string;
  onNavigate: () => void;
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
                onClick={onNavigate}
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
  // Schließt sich beim Klick auf einen Link (siehe onClick-Handler unten) -
  // Next.js' Client-Navigation entfernt diese Komponente sonst nicht, der
  // Zustand müsste sich sonst selbst zurücksetzen.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <Link href="/admin" className="text-sm font-semibold tracking-wide text-copper-light">
          KARA Cockpit
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menü öffnen"
          className="rounded border border-border px-3 py-1.5 text-sm text-silver-light"
        >
          ☰
        </button>
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 flex-col overflow-y-auto border-r border-border bg-background transition-transform duration-200 md:static md:z-auto md:flex md:w-64 md:translate-x-0 md:transition-none ${
          mobileOpen ? "flex translate-x-0" : "hidden -translate-x-full"
        }`}
      >
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
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
          {auftraggeberOpen && (
            <div className="px-4 pb-1" onClick={() => setMobileOpen(false)}>
              {clientTree}
            </div>
          )}

          <NavGroup
            label="Personal"
            open={personalOpen}
            onToggle={() => setPersonalOpen((v) => !v)}
            items={PERSONAL_ITEMS}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />

          <NavGroup
            label="Liquidität & Finanzen"
            open={finanzenOpen}
            onToggle={() => setFinanzenOpen((v) => !v)}
            items={FINANZEN_ITEMS}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />

          {FLAT_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
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
    </>
  );
}
