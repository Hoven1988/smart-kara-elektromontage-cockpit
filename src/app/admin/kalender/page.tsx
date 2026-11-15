import Link from "next/link";
import { sql } from "@/lib/db";
import { createCalendarEntry, deleteCalendarEntry, setCalendarEntryDone } from "@/actions/calendar";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DeadlineCheckbox } from "@/components/deadline-checkbox";
import {
  startOfWeek,
  addDays,
  addMonths,
  toDateStr,
  isSameDay,
  getMonthGridDays,
  getWeekDays,
} from "@/lib/calendar";

type CalendarEntry = {
  id: number;
  date: unknown;
  title: string;
  note: string | null;
  done: boolean;
};

function formatDate(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
}

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function CalendarGrid({
  days,
  entriesByDate,
  today,
  compact,
}: {
  days: Date[];
  entriesByDate: Map<string, CalendarEntry[]>;
  today: Date;
  compact: boolean;
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded border border-border">
      {WEEKDAY_LABELS.map((label) => (
        <div
          key={label}
          className="border-b border-border bg-card px-2 py-1.5 text-center text-xs font-medium text-silver"
        >
          {label}
        </div>
      ))}
      {days.map((day) => {
        const dateStr = toDateStr(day);
        const entries = entriesByDate.get(dateStr) ?? [];
        const isToday = isSameDay(day, today);
        return (
          <div
            key={dateStr}
            className={`border-b border-r border-border p-1 ${compact ? "min-h-14" : "min-h-12"}`}
          >
            <p className={`text-[11px] ${isToday ? "font-semibold text-copper-light" : "text-silver"}`}>
              {day.getDate()}.{day.getMonth() + 1}.
            </p>
            <ul className="flex flex-col gap-0.5">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className={`truncate text-[10px] ${
                    entry.done ? "text-silver line-through" : "text-silver-light"
                  }`}
                  title={entry.title}
                >
                  {entry.title}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = viewParam === "woche" ? "woche" : "monat";
  const today = new Date();
  const anchor = dateParam ? new Date(`${dateParam}T00:00:00`) : today;

  const days = view === "monat" ? getMonthGridDays(anchor) : getWeekDays(anchor);
  const rangeFrom = toDateStr(days[0]);
  const rangeTo = toDateStr(days[days.length - 1]);

  const [gridRows, allRows] = await Promise.all([
    sql`
      SELECT id, date, title, note, done
      FROM calendar_entries
      WHERE date >= ${rangeFrom} AND date <= ${rangeTo}
      ORDER BY date ASC
    `,
    sql`
      SELECT id, date, title, note, done
      FROM calendar_entries
      ORDER BY date ASC
    `,
  ]);

  const entriesByDate = new Map<string, CalendarEntry[]>();
  for (const row of gridRows as unknown as CalendarEntry[]) {
    const key = toDateStr(row.date instanceof Date ? row.date : new Date(String(row.date)));
    const list = entriesByDate.get(key) ?? [];
    list.push(row);
    entriesByDate.set(key, list);
  }

  const entries = allRows as unknown as CalendarEntry[];

  const prevAnchor = view === "monat" ? addMonths(anchor, -1) : addDays(startOfWeek(anchor), -7);
  const nextAnchor = view === "monat" ? addMonths(anchor, 1) : addDays(startOfWeek(anchor), 7);
  const rangeLabel =
    view === "monat"
      ? anchor.toLocaleDateString("de-DE", { month: "long", year: "numeric" })
      : `${days[0].toLocaleDateString("de-DE", { dateStyle: "medium" })} – ${days[6].toLocaleDateString("de-DE", { dateStyle: "medium" })}`;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Kalender</h1>

      <div className="mb-10 flex flex-wrap items-start gap-10">
        <div className="max-w-sm flex-1">
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
                defaultValue={toDateStr(anchor)}
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

        <div className="w-full max-w-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Link
                href={`/admin/kalender?view=${view}&date=${toDateStr(prevAnchor)}`}
                className="rounded border border-border px-2 py-1 text-xs text-silver-light visited:text-silver-light hover:border-copper"
              >
                ‹
              </Link>
              <span className="min-w-28 text-center text-xs font-medium text-silver-light">
                {rangeLabel}
              </span>
              <Link
                href={`/admin/kalender?view=${view}&date=${toDateStr(nextAnchor)}`}
                className="rounded border border-border px-2 py-1 text-xs text-silver-light visited:text-silver-light hover:border-copper"
              >
                ›
              </Link>
              <Link
                href={`/admin/kalender?view=${view}&date=${toDateStr(today)}`}
                className="ml-1 rounded border border-border px-2 py-1 text-xs text-silver visited:text-silver hover:border-copper"
              >
                Heute
              </Link>
            </div>

            <div className="flex gap-1">
              <Link
                href={`/admin/kalender?view=monat&date=${toDateStr(anchor)}`}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  view === "monat"
                    ? "bg-copper text-background"
                    : "border border-border text-silver-light visited:text-silver-light"
                }`}
              >
                Monat
              </Link>
              <Link
                href={`/admin/kalender?view=woche&date=${toDateStr(anchor)}`}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  view === "woche"
                    ? "bg-copper text-background"
                    : "border border-border text-silver-light visited:text-silver-light"
                }`}
              >
                Woche
              </Link>
            </div>
          </div>

          <CalendarGrid days={days} entriesByDate={entriesByDate} today={today} compact={view === "monat"} />
        </div>
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
                className={`flex items-start justify-between gap-3 rounded border border-border px-4 py-2 text-sm ${
                  entry.done ? "opacity-50" : ""
                }`}
              >
                <div>
                  <span className="font-medium text-silver-light">{formatDate(entry.date)}</span>{" "}
                  <span className={`text-silver ${entry.done ? "line-through" : ""}`}>
                    – {entry.title}
                    {entry.note ? ` · ${entry.note}` : ""}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <DeadlineCheckbox
                    checked={entry.done}
                    label="Erledigt"
                    onToggle={setCalendarEntryDone.bind(null, entry.id)}
                  />
                  <form action={deleteCalendarEntry.bind(null, entry.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Diesen Termin wirklich löschen?"
                      className="text-xs text-silver hover:text-danger"
                    >
                      Löschen
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
