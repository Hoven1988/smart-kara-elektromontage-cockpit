import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function durationLabel(start: unknown, end: unknown, breakMinutes: number): string {
  if (!start || !end) return "läuft…";
  const startDate = start instanceof Date ? start : new Date(String(start));
  const endDate = end instanceof Date ? end : new Date(String(end));
  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000) - breakMinutes);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export default async function MyTimePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const entries = (await sql`
    SELECT t.id, t.started_at, t.ended_at, t.break_minutes, t.note, p.title AS project_title
    FROM time_entries t
    JOIN projects p ON p.id = t.project_id
    WHERE t.user_id = ${user.userId}
    ORDER BY t.started_at DESC
  `) as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    project_title: string;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Meine Zeiten</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Zeiten erfasst.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Auftrag</th>
                <th className="px-4 py-3 font-medium">Beginn</th>
                <th className="px-4 py-3 font-medium">Dauer</th>
                <th className="px-4 py-3 font-medium">Notiz</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-silver-light">{entry.project_title}</td>
                  <td className="px-4 py-3 text-silver">{toDateTimeLabel(entry.started_at)}</td>
                  <td className="px-4 py-3 text-silver">
                    {durationLabel(entry.started_at, entry.ended_at, entry.break_minutes)}
                  </td>
                  <td className="px-4 py-3 text-silver">{entry.note ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
