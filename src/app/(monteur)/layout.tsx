import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { LogoutButton } from "@/components/logout-button";
import { SaveToast } from "@/components/save-toast";
import { MonteurSidebarNav } from "@/components/monteur-sidebar-nav";

// Wie im Admin-Bereich: nie statisch vorab berechnen.
export const dynamic = "force-dynamic";

export default async function MonteurLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const openEntryRows = user
    ? await sql`
        SELECT t.started_at, t.project_id, p.title AS project_title
        FROM time_entries t
        LEFT JOIN projects p ON p.id = t.project_id
        WHERE t.user_id = ${user.userId} AND t.ended_at IS NULL
      `
    : [];
  const openEntry = (
    openEntryRows as unknown as Array<{
      started_at: unknown;
      project_id: number | null;
      project_title: string | null;
    }>
  )[0];

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Desktop/Tablet: feste Seitenleiste wie im Admin-Bereich */}
      <aside className="hidden w-64 flex-col border-r border-border md:flex">
        <MonteurSidebarNav openEntry={openEntry ?? null} />
      </aside>

      <div className="flex flex-1 flex-col">
        {/* Handy: schmale Kopfzeile statt Seitenleiste */}
        <header className="flex items-center justify-between border-b border-border px-6 py-4 md:hidden">
          <Link href="/" className="text-sm font-semibold tracking-wide text-copper-light">
            KARA Cockpit
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-sm text-silver-light">{user?.name}</p>
            <LogoutButton />
          </div>
        </header>

        <main className="flex flex-1 flex-col">{children}</main>

        {/* Handy: Navigation unten statt Seitenleiste */}
        <nav className="flex border-t border-border md:hidden">
          <Link
            href="/"
            className="flex-1 px-3 py-3 text-center text-sm text-silver hover:text-silver-light"
          >
            Aufträge
          </Link>
          <Link
            href="/zeiten"
            className="flex-1 border-l border-border px-3 py-3 text-center text-sm text-silver hover:text-silver-light"
          >
            Zeiten
          </Link>
          <Link
            href="/zeiten/neu"
            className="flex-1 border-l border-border px-3 py-3 text-center text-sm text-silver hover:text-silver-light"
          >
            Eintragen
          </Link>
          <Link
            href="/urlaub"
            className="flex-1 border-l border-border px-3 py-3 text-center text-sm text-silver hover:text-silver-light"
          >
            Urlaub
          </Link>
        </nav>
      </div>
      <SaveToast />
    </div>
  );
}
