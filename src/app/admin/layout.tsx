import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { DevFooter } from "@/components/dev-footer";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/kunden", label: "Kunden" },
  { href: "/admin/auftraege", label: "Aufträge" },
  { href: "/admin/planung", label: "Einsatzplanung" },
  { href: "/admin/zeiten", label: "Zeiten" },
  { href: "/admin/mitarbeiter", label: "Mitarbeiter" },
  { href: "/admin/einstellungen", label: "Einstellungen" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 flex-col border-r border-border px-4 py-6">
        <p className="mb-6 px-2 text-lg font-semibold tracking-wide text-copper-light">
          KARA Cockpit
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <DevFooter compact />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-sm text-silver">Angemeldet als</p>
            <p className="font-medium text-silver-light">{user?.name} (Admin)</p>
          </div>
          <LogoutButton />
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
