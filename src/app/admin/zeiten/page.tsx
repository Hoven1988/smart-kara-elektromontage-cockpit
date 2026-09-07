import { sql } from "@/lib/db";
import { updateTimeEntry } from "@/actions/time";

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

export default async function AdminTimePage() {
  const entries = (await sql`
    SELECT t.id, t.started_at, t.ended_at, t.break_minutes, t.note, t.edited_by_admin,
           u.name AS user_name, p.title AS project_title
    FROM time_entries t
    JOIN users u ON u.id = t.user_id
    JOIN projects p ON p.id = t.project_id
    ORDER BY t.started_at DESC
    LIMIT 200
  `) as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    edited_by_admin: boolean;
    user_name: string;
    project_title: string;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Zeiten</h1>
      {entries.length === 0 ? (
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
              {entries.map((entry) => (
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
                      className="w-44 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`edit-${entry.id}`}
                      name="break_minutes"
                      type="number"
                      min={0}
                      defaultValue={entry.break_minutes}
                      className="w-16 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`edit-${entry.id}`}
                      name="note"
                      defaultValue={entry.note ?? ""}
                      className="w-32 rounded border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-copper"
                    />
                  </td>
                  <td className="px-4 py-3">
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
