import { sql } from "@/lib/db";
import { createCalendarEntry, deleteCalendarEntry } from "@/actions/calendar";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function KalenderPage() {
  const rows = await sql`
    SELECT id, date, title, note
    FROM calendar_entries
    ORDER BY date ASC
  `;
  const entries = rows as unknown as Array<{
    id: number;
    date: unknown;
    title: string;
    note: string | null;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Kalender</h1>

      <div className="mb-10 max-w-lg">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Neuer Termin / Notiz</h2>
        <form action={createCalendarEntry} className="flex flex-col gap-4">
          <div>
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
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="title">
              Titel
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="z.B. Steuervorauszahlung Finanzamt"
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="note">
              Notiz (optional)
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
            Eintragen
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Alle Termine</h2>
        {entries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Termine erfasst.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded border border-border px-4 py-2 text-sm"
              >
                <div>
                  <span className="font-medium text-silver-light">{formatDate(entry.date)}</span>{" "}
                  <span className="text-silver">
                    – {entry.title}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </span>
                </div>
                <form action={deleteCalendarEntry.bind(null, entry.id)}>
                  <ConfirmSubmitButton
                    confirmMessage="Diesen Termin wirklich löschen?"
                    className="shrink-0 text-xs text-silver hover:text-danger"
                  >
                    Löschen
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
