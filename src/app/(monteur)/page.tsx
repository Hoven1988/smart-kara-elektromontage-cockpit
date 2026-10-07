import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { clockIn, clockOut } from "@/actions/time";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default async function MonteurHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [assignmentRows, openEntryRows] = await Promise.all([
    sql`
      SELECT a.id, a.date, a.start_time, a.end_time, p.id AS project_id, p.title, p.address, p.status
      FROM assignments a
      JOIN projects p ON p.id = a.project_id
      WHERE a.user_id = ${user.userId}
      ORDER BY a.date ASC
    `,
    sql`
      SELECT t.id, t.started_at, t.project_id, p.title AS project_title
      FROM time_entries t
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ${user.userId} AND t.ended_at IS NULL
    `,
  ]);

  const assignments = assignmentRows as unknown as Array<{
    id: number;
    date: unknown;
    start_time: unknown;
    end_time: unknown;
    project_id: number;
    title: string;
    address: string | null;
    status: string;
  }>;

  const openEntry = (
    openEntryRows as unknown as Array<{
      id: number;
      started_at: unknown;
      project_id: number | null;
      project_title: string | null;
    }>
  )[0];

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-8 md:hidden">
        {openEntry ? (
          <form
            action={clockOut.bind(null, openEntry.project_id)}
            className="flex max-w-sm flex-col gap-3"
          >
            <p className="text-sm text-silver">
              Eingestempelt seit {toDateTimeLabel(openEntry.started_at)}
              {openEntry.project_id ? ` · ${openEntry.project_title}` : " · Allgemein"}
            </p>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="break_minutes">
                Pause (Minuten)
              </label>
              <input
                id="break_minutes"
                name="break_minutes"
                type="number"
                min={0}
                defaultValue={0}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="note">
                Notiz
              </label>
              <input
                id="note"
                name="note"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
            >
              Ausstempeln
            </button>
          </form>
        ) : (
          <form action={clockIn.bind(null, null)}>
            <button
              type="submit"
              className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
            >
              Einstempeln
            </button>
          </form>
        )}
      </div>

      <h1 className="mb-6 text-xl font-semibold text-silver-light">Meine Aufträge</h1>
      {assignments.length === 0 ? (
        <p className="text-sm text-silver">Dir sind aktuell keine Aufträge zugewiesen.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link
                href={`/auftrag/${assignment.project_id}`}
                className="flex flex-col gap-1 rounded border border-border px-4 py-3 hover:border-copper"
              >
                <span className="font-medium text-silver-light">{assignment.title}</span>
                <span className="text-sm text-silver">
                  {toDateInputValue(assignment.date)}
                  {assignment.address ? ` · ${assignment.address}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
