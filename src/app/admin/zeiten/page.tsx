import { sql } from "@/lib/db";
import { updateTimeEntry, createTimeEntry, reviewTimeEntryChange } from "@/actions/time";
import { PrintButton } from "@/components/print-button";

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function toDateTimeInputValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function durationLabel(start: unknown, end: unknown, breakMinutes: number): string {
  if (!start || !end) return "läuft…";
  const startDate = start instanceof Date ? start : new Date(String(start));
  const endDate = end instanceof Date ? end : new Date(String(end));
  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000) - breakMinutes);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

function toDateTimeLabelSafe(value: unknown): string {
  return value ? toDateTimeLabel(value) : "–";
}

export default async function AdminTimePage() {
  const [entries, employees, projects, changeRequests] = await Promise.all([
    sql`
      SELECT t.id, t.started_at, t.ended_at, t.break_minutes, t.note, t.edited_by_admin,
             u.name AS user_name, p.title AS project_title
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      JOIN projects p ON p.id = t.project_id
      ORDER BY t.started_at DESC
      LIMIT 200
    `,
    sql`SELECT id, name FROM users WHERE active = true ORDER BY name ASC`,
    sql`SELECT id, title FROM projects ORDER BY title ASC`,
    sql`
      SELECT r.id, r.requested_ended_at, r.requested_break_minutes, r.requested_note, r.reason,
             r.created_at, u.name AS user_name, p.title AS project_title,
             t.ended_at AS current_ended_at, t.break_minutes AS current_break_minutes,
             t.note AS current_note
      FROM time_entry_change_requests r
      JOIN users u ON u.id = r.requested_by
      JOIN time_entries t ON t.id = r.time_entry_id
      JOIN projects p ON p.id = t.project_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
    `,
  ]);

  const timeEntries = entries as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    edited_by_admin: boolean;
    user_name: string;
    project_title: string;
  }>;
  const employeeList = employees as unknown as Array<{ id: number; name: string }>;
  const projectList = projects as unknown as Array<{ id: number; title: string }>;
  const pendingRequests = changeRequests as unknown as Array<{
    id: number;
    requested_ended_at: unknown;
    requested_break_minutes: number | null;
    requested_note: string | null;
    reason: string;
    user_name: string;
    project_title: string;
    current_ended_at: unknown;
    current_break_minutes: number;
    current_note: string | null;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Zeiten</h1>
        <PrintButton label="Als PDF speichern" />
      </div>
      <p className="mb-6 hidden text-sm text-silver print:block">
        KARA Cockpit · Zeiterfassung · Stand{" "}
        {new Date().toLocaleDateString("de-DE", { dateStyle: "long" })}
      </p>

      {pendingRequests.length > 0 && (
        <div className="print:hidden mb-8 max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold text-silver-light">
            Offene Änderungsanfragen ({pendingRequests.length})
          </h2>
          <ul className="flex flex-col gap-3">
            {pendingRequests.map((req) => (
              <li key={req.id} className="rounded border border-copper/40 bg-card p-4 text-sm">
                <p className="mb-1 font-medium text-silver-light">
                  {req.user_name} · {req.project_title}
                </p>
                <p className="mb-1 text-silver">Begründung: {req.reason}</p>
                <p className="mb-3 text-xs text-silver">
                  Ende: {toDateTimeLabelSafe(req.current_ended_at)} →{" "}
                  {toDateTimeLabelSafe(req.requested_ended_at)} · Pause:{" "}
                  {req.current_break_minutes} → {req.requested_break_minutes ?? req.current_break_minutes}{" "}
                  min · Notiz: {req.current_note ?? "–"} → {req.requested_note ?? req.current_note ?? "–"}
                </p>
                <div className="flex gap-3">
                  <form action={reviewTimeEntryChange.bind(null, req.id, "approved")}>
                    <button
                      type="submit"
                      className="rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
                    >
                      Freigeben
                    </button>
                  </form>
                  <form action={reviewTimeEntryChange.bind(null, req.id, "rejected")}>
                    <button
                      type="submit"
                      className="rounded border border-border px-3 py-1.5 text-xs text-silver transition-colors hover:border-danger hover:text-danger"
                    >
                      Ablehnen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details className="print:hidden mb-8 max-w-2xl rounded border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
          Zeit manuell erfassen
        </summary>
        <form action={createTimeEntry} className="flex flex-col gap-3 border-t border-border p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="user_id">
                Mitarbeiter
              </label>
              <select
                id="user_id"
                name="user_id"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              >
                <option value="">– Auswählen –</option>
                {employeeList.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="project_id">
                Auftrag
              </label>
              <select
                id="project_id"
                name="project_id"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              >
                <option value="">– Auswählen –</option>
                {projectList.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="date">
                Datum
              </label>
              <input
                id="date"
                name="date"
                type="date"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="start_time">
                Von
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="end_time">
                Bis
              </label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-sm text-silver" htmlFor="break_minutes">
                Pause (min)
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
            Zeit erfassen
          </button>
        </form>
      </details>

      {timeEntries.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Zeiten erfasst.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Mitarbeiter</th>
                <th className="px-4 py-3 font-medium">Auftrag</th>
                <th className="px-4 py-3 font-medium">Beginn</th>
                <th className="px-4 py-3 font-medium">Dauer</th>
                <th className="px-4 py-3 font-medium">Ende</th>
                <th className="px-4 py-3 font-medium">Pause (min)</th>
                <th className="px-4 py-3 font-medium">Notiz</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {timeEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-silver-light">{entry.user_name}</td>
                  <td className="px-4 py-3 text-silver-light">{entry.project_title}</td>
                  <td className="px-4 py-3 text-silver">{toDateTimeLabel(entry.started_at)}</td>
                  <td className="px-4 py-3 text-silver">
                    {durationLabel(entry.started_at, entry.ended_at, entry.break_minutes)}
                    {entry.edited_by_admin && (
                      <span className="ml-1 text-xs text-copper-light">(korrigiert)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`edit-${entry.id}`}
                      name="ended_at"
                      type="datetime-local"
                      defaultValue={toDateTimeInputValue(entry.ended_at)}
                      className="print:hidden w-44 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                    <span className="hidden text-silver print:inline">
                      {toDateTimeLabel(entry.ended_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`edit-${entry.id}`}
                      name="break_minutes"
                      type="number"
                      min={0}
                      defaultValue={entry.break_minutes}
                      className="print:hidden w-16 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                    <span className="hidden text-silver print:inline">{entry.break_minutes}</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`edit-${entry.id}`}
                      name="note"
                      defaultValue={entry.note ?? ""}
                      className="print:hidden w-32 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                    <span className="hidden text-silver print:inline">{entry.note ?? "–"}</span>
                  </td>
                  <td className="px-4 py-3 print:hidden">
                    <form id={`edit-${entry.id}`} action={updateTimeEntry.bind(null, entry.id)} />
                    <button
                      form={`edit-${entry.id}`}
                      type="submit"
                      className="text-xs text-copper-light hover:underline"
                    >
                      Speichern
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
