import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { requestTimeEntryChange } from "@/actions/time";

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

const STATUS_LABELS: Record<string, string> = {
  pending: "Änderung beantragt – wartet auf Freigabe",
  approved: "Änderung wurde freigegeben",
  rejected: "Änderung wurde abgelehnt",
};

export default async function MyTimePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [entryRows, requestRows] = await Promise.all([
    sql`
      SELECT t.id, t.started_at, t.ended_at, t.break_minutes, t.note, p.title AS project_title
      FROM time_entries t
      JOIN projects p ON p.id = t.project_id
      WHERE t.user_id = ${user.userId}
      ORDER BY t.started_at DESC
    `,
    sql`
      SELECT DISTINCT ON (time_entry_id) time_entry_id, status
      FROM time_entry_change_requests
      WHERE requested_by = ${user.userId}
      ORDER BY time_entry_id, created_at DESC
    `,
  ]);

  const entries = entryRows as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    project_title: string;
  }>;

  const latestRequestByEntry = new Map<number, string>();
  for (const row of requestRows as unknown as Array<{ time_entry_id: number; status: string }>) {
    latestRequestByEntry.set(row.time_entry_id, row.status);
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Meine Zeiten</h1>
      {entries.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Zeiten erfasst.</p>
      ) : (
        <ul className="flex max-w-2xl flex-col gap-3">
          {entries.map((entry) => {
            const status = latestRequestByEntry.get(entry.id);
            const canRequest = Boolean(entry.ended_at) && status !== "pending";
            return (
              <li key={entry.id} className="rounded border border-border p-4 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-silver-light">{entry.project_title}</span>
                  <span className="text-silver">
                    {durationLabel(entry.started_at, entry.ended_at, entry.break_minutes)}
                  </span>
                </div>
                <p className="text-silver">
                  {toDateTimeLabel(entry.started_at)}
                  {entry.ended_at ? ` – ${toDateTimeLabel(entry.ended_at)}` : ""} · Pause{" "}
                  {entry.break_minutes} min
                  {entry.note ? ` · ${entry.note}` : ""}
                </p>

                {status && (
                  <p
                    className={`mt-2 text-xs ${
                      status === "rejected" ? "text-danger" : "text-copper-light"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </p>
                )}

                {canRequest && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-silver hover:text-copper-light">
                      Änderung beantragen
                    </summary>
                    <form
                      action={requestTimeEntryChange.bind(null, entry.id)}
                      className="mt-3 flex flex-col gap-2"
                    >
                      <div>
                        <label className="mb-1 block text-xs text-silver">Neues Ende</label>
                        <input
                          name="ended_at"
                          type="datetime-local"
                          defaultValue={toDateTimeInputValue(entry.ended_at)}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-silver">Neue Pause (min)</label>
                        <input
                          name="break_minutes"
                          type="number"
                          min={0}
                          defaultValue={entry.break_minutes}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-silver">Neue Notiz</label>
                        <input
                          name="note"
                          defaultValue={entry.note ?? ""}
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-silver">
                          Begründung (Pflicht)
                        </label>
                        <input
                          name="reason"
                          required
                          placeholder="z.B. Ende vergessen einzutragen"
                          className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                        />
                      </div>
                      <button
                        type="submit"
                        className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
                      >
                        Änderung beantragen
                      </button>
                    </form>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
