import Link from "next/link";
import { sql } from "@/lib/db";

function toTimeLabel(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toTimeSinceLabel(value: unknown): string {
  if (!value) return "";
  const started = value instanceof Date ? value : new Date(String(value));
  return started.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default async function AdminDashboard() {
  const today = new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [todaysAssignments, clockedIn] = await Promise.all([
    sql`
      SELECT a.id, u.name AS user_name, p.id AS project_id, p.title AS project_title,
             a.start_time, a.end_time, a.note
      FROM assignments a
      JOIN users u ON u.id = a.user_id
      JOIN projects p ON p.id = a.project_id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.start_time ASC NULLS LAST, u.name ASC
    `,
    sql`
      SELECT t.id, u.name AS user_name, p.id AS project_id, p.title AS project_title, t.started_at
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      JOIN projects p ON p.id = t.project_id
      WHERE t.ended_at IS NULL
      ORDER BY t.started_at ASC
    `,
  ]);

  const assignments = todaysAssignments as unknown as Array<{
    id: number;
    user_name: string;
    project_id: number;
    project_title: string;
    start_time: unknown;
    end_time: unknown;
    note: string | null;
  }>;

  const active = clockedIn as unknown as Array<{
    id: number;
    user_name: string;
    project_id: number;
    project_title: string;
    started_at: unknown;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="text-xl font-semibold text-silver-light">Dashboard</h1>
      <p className="mb-8 text-sm text-silver">{today}</p>

      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Heute im Einsatz</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-silver">Für heute ist niemand eingeteilt.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignments.map((a) => (
                <li key={a.id} className="rounded border border-border bg-card px-4 py-2 text-sm">
                  <span className="font-medium text-silver-light">{a.user_name}</span>{" "}
                  <span className="text-silver">
                    –{" "}
                    <Link href={`/admin/auftraege/${a.project_id}`} className="hover:text-copper-light">
                      {a.project_title}
                    </Link>
                    {Boolean(a.start_time) && ` · ${toTimeLabel(a.start_time)}`}
                    {Boolean(a.end_time) && `–${toTimeLabel(a.end_time)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Aktuell eingestempelt</h2>
          {active.length === 0 ? (
            <p className="text-sm text-silver">Niemand ist gerade eingestempelt.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.map((entry) => (
                <li key={entry.id} className="rounded border border-border bg-card px-4 py-2 text-sm">
                  <span className="font-medium text-silver-light">{entry.user_name}</span>{" "}
                  <span className="text-silver">
                    –{" "}
                    <Link href={`/admin/auftraege/${entry.project_id}`} className="hover:text-copper-light">
                      {entry.project_title}
                    </Link>{" "}
                    · seit {toTimeSinceLabel(entry.started_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
