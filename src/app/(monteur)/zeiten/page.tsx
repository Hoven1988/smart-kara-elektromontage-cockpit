import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { requestTimeEntryChange, updateOwnTimeEntry, deleteOwnTimeEntry } from "@/actions/time";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

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

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

  const [entryRows, requestRows, projectRows, customerRows] = await Promise.all([
    sql`
      SELECT t.id, t.project_id, t.customer_id, t.started_at, t.ended_at, t.break_minutes, t.note,
             t.km_driven, t.self_entered, p.title AS project_title, c.name AS customer_name
      FROM time_entries t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE t.user_id = ${user.userId}
      ORDER BY t.started_at DESC
    `,
    sql`
      SELECT DISTINCT ON (time_entry_id) time_entry_id, status
      FROM time_entry_change_requests
      WHERE requested_by = ${user.userId}
      ORDER BY time_entry_id, created_at DESC
    `,
    sql`
      SELECT DISTINCT p.id, p.title
      FROM assignments a
      JOIN projects p ON p.id = a.project_id
      WHERE a.user_id = ${user.userId}
      ORDER BY p.title ASC
    `,
    sql`SELECT id, name FROM customers ORDER BY name ASC`,
  ]);

  const entries = entryRows as unknown as Array<{
    id: number;
    project_id: number | null;
    customer_id: number | null;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    km_driven: number | null;
    self_entered: boolean;
    project_title: string | null;
    customer_name: string | null;
  }>;
  const projects = projectRows as unknown as Array<{ id: number; title: string }>;
  const customers = customerRows as unknown as Array<{ id: number; name: string }>;

  const latestRequestByEntry = new Map<number, string>();
  for (const row of requestRows as unknown as Array<{ time_entry_id: number; status: string }>) {
    latestRequestByEntry.set(row.time_entry_id, row.status);
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Meine Zeiten</h1>
        <Link
          href="/zeiten/neu"
          className="rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
        >
          + Zeit eintragen
        </Link>
      </div>
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
                  <span className="font-medium text-silver-light">
                    {entry.project_title ?? entry.customer_name ?? "Allgemein"}
                  </span>
                  <span className="text-silver">
                    {durationLabel(entry.started_at, entry.ended_at, entry.break_minutes)}
                  </span>
                </div>
                <p className="text-silver">
                  {toDateTimeLabel(entry.started_at)}
                  {entry.ended_at ? ` – ${toDateTimeLabel(entry.ended_at)}` : ""} · Pause{" "}
                  {entry.break_minutes} min
                  {entry.project_title && entry.customer_name ? ` · ${entry.customer_name}` : ""}
                  {entry.km_driven != null ? ` · ${entry.km_driven} km` : ""}
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

                {entry.self_entered ? (
                  <div className="mt-3 flex items-center gap-3">
                    <details className="flex-1">
                      <summary className="cursor-pointer text-xs text-silver hover:text-copper-light">
                        Bearbeiten
                      </summary>
                      <form
                        action={updateOwnTimeEntry.bind(null, entry.id)}
                        className="mt-3 flex flex-col gap-2"
                      >
                        <div>
                          <label className="mb-1 block text-xs text-silver">Auftrag</label>
                          <select
                            name="project_id"
                            defaultValue={entry.project_id ?? ""}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                          >
                            <option value="">Allgemein (kein Auftrag)</option>
                            {projects.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-silver">Kunde</label>
                          <select
                            name="customer_id"
                            defaultValue={entry.customer_id ?? ""}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                          >
                            <option value="">– Auswählen (optional) –</option>
                            {customers.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-silver">Datum</label>
                            <input
                              name="date"
                              type="date"
                              required
                              defaultValue={toDateInputValue(entry.started_at)}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-silver">Von</label>
                            <input
                              name="start_time"
                              type="time"
                              required
                              defaultValue={toTimeInputValue(entry.started_at)}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="mb-1 block text-xs text-silver">Bis</label>
                            <input
                              name="end_time"
                              type="time"
                              required
                              defaultValue={toTimeInputValue(entry.ended_at)}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                            />
                          </div>
                          <div className="w-20">
                            <label className="mb-1 block text-xs text-silver">Km</label>
                            <input
                              name="km_driven"
                              type="number"
                              min={0}
                              step="0.1"
                              defaultValue={entry.km_driven ?? ""}
                              className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-silver">
                          Pause wird automatisch berechnet (ab 6h: 30 min, ab 9h: 45 min).
                        </p>
                        <div>
                          <label className="mb-1 block text-xs text-silver">Notiz</label>
                          <input
                            name="note"
                            defaultValue={entry.note ?? ""}
                            className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none focus:border-copper"
                          />
                        </div>
                        <button
                          type="submit"
                          className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
                        >
                          Speichern
                        </button>
                      </form>
                    </details>
                    <form action={deleteOwnTimeEntry.bind(null, entry.id)}>
                      <ConfirmSubmitButton
                        confirmMessage="Diesen Eintrag wirklich löschen?"
                        className="shrink-0 text-xs text-silver hover:text-danger"
                      >
                        Löschen
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                ) : (
                  canRequest && (
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
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
