import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { closeExpiredTimeEntries } from "@/lib/worktime";
import { LogoutButton } from "@/components/logout-button";
import { SaveToast } from "@/components/save-toast";
import { MonteurSidebarNav } from "@/components/monteur-sidebar-nav";
import { MonteurClockPanel } from "@/components/monteur-clock-panel";

// Wie im Admin-Bereich: nie statisch vorab berechnen.
export const dynamic = "force-dynamic";

export default async function MonteurLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) await closeExpiredTimeEntries();

  const [openEntryRows, customerRows, assignmentDateRows, monthSummaryRows] = user
    ? await Promise.all([
        sql`
          SELECT t.started_at, t.project_id, p.title AS project_title
          FROM time_entries t
          LEFT JOIN projects p ON p.id = t.project_id
          WHERE t.user_id = ${user.userId} AND t.ended_at IS NULL
        `,
        sql`SELECT id, name FROM customers ORDER BY name ASC`,
        sql`SELECT date FROM assignments WHERE user_id = ${user.userId}`,
        sql`
          SELECT
            COALESCE(SUM(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60 - break_minutes), 0) AS worked_minutes,
            COALESCE(SUM(km_driven), 0) AS km_total,
            COUNT(DISTINCT started_at::date) AS days_worked
          FROM time_entries
          WHERE user_id = ${user.userId} AND ended_at IS NOT NULL
            AND started_at >= date_trunc('month', CURRENT_DATE)
            AND started_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
        `,
      ])
    : [[], [], [], []];
  const openEntry = (
    openEntryRows as unknown as Array<{
      started_at: unknown;
      project_id: number | null;
      project_title: string | null;
    }>
  )[0];
  const customers = customerRows as unknown as Array<{ id: number; name: string }>;
  const assignmentDates = (assignmentDateRows as unknown as Array<{ date: unknown }>).map((row) =>
    (row.date instanceof Date ? row.date : new Date(String(row.date))).toISOString().slice(0, 10)
  );
  const monthSummaryRow = (
    monthSummaryRows as unknown as Array<{ worked_minutes: number; km_total: number; days_worked: number }>
  )[0];
  const monthSummary = {
    workedMinutes: Math.round(Number(monthSummaryRow?.worked_minutes ?? 0)),
    kmTotal: Number(monthSummaryRow?.km_total ?? 0),
    daysWorked: Number(monthSummaryRow?.days_worked ?? 0),
  };

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      {/* Desktop/Tablet: feste Seitenleiste wie im Admin-Bereich */}
      <aside className="hidden w-56 flex-col border-r border-border md:flex">
        <MonteurSidebarNav />
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

      {/* Desktop/Tablet: Einstempeln + Kalender rechts neben dem Inhalt */}
      <aside className="hidden w-72 flex-col border-l border-border md:flex">
        <MonteurClockPanel
          openEntry={openEntry ?? null}
          customers={customers}
          assignmentDates={assignmentDates}
          monthSummary={monthSummary}
        />
      </aside>
      <SaveToast />
    </div>
  );
}
