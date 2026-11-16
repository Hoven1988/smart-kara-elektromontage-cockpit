import { clockIn, clockOut } from "@/actions/time";
import { getMonthGridDays, toDateStr, isSameDay } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export function MonteurClockPanel({
  openEntry,
  customers,
  assignmentDates,
  monthSummary,
}: {
  openEntry: {
    started_at: unknown;
    project_id: number | null;
    project_title: string | null;
  } | null;
  customers: Array<{ id: number; name: string }>;
  assignmentDates: string[];
  monthSummary: { workedMinutes: number; kmTotal: number; daysWorked: number };
}) {
  const today = new Date();
  const days = getMonthGridDays(today);
  const assignmentSet = new Set(assignmentDates);

  return (
    <div className="flex flex-col gap-6 p-4">
      {openEntry ? (
        <form action={clockOut.bind(null, openEntry.project_id)} className="flex flex-col gap-2">
          <p className="text-xs text-silver">
            Eingestempelt seit {toDateTimeLabel(openEntry.started_at)}
            <br />
            {openEntry.project_id ? openEntry.project_title : "Allgemein"}
          </p>
          <input
            name="note"
            placeholder="Notiz (optional)"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper"
          />
          <button
            type="submit"
            className="rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
          >
            Ausstempeln
          </button>
          <p className="text-[11px] text-silver">Pause wird automatisch abgezogen.</p>
        </form>
      ) : (
        <form action={clockIn.bind(null, null)} className="flex flex-col gap-2">
          <select
            name="customer_id"
            defaultValue=""
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper"
          >
            <option value="">Kunde (optional)</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          <input
            name="note"
            placeholder="Baustelle (optional)"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper"
          />
          <input
            name="km_driven"
            type="number"
            min={0}
            step="0.1"
            placeholder="Gefahrene km (optional)"
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-copper"
          />
          <button
            type="submit"
            className="w-full rounded bg-copper px-3 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Einstempeln
          </button>
        </form>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-silver-light">
          {today.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-7 overflow-hidden rounded border border-border text-[10px]">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="border-b border-border bg-card py-1 text-center text-silver">
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dateStr = toDateStr(day);
            const isToday = isSameDay(day, today);
            const hasAssignment = assignmentSet.has(dateStr);
            const inMonth = day.getMonth() === today.getMonth();
            return (
              <div
                key={dateStr}
                className={`border-b border-r border-border py-1.5 text-center ${
                  inMonth ? "" : "opacity-30"
                } ${
                  isToday
                    ? "bg-copper font-semibold text-background"
                    : hasAssignment
                      ? "font-medium text-copper-light"
                      : "text-silver"
                }`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-silver-light">Diesen Monat</p>
        <div className="flex flex-col gap-1 rounded border border-border px-3 py-2 text-sm text-silver">
          <p>
            {Math.floor(monthSummary.workedMinutes / 60)}h {monthSummary.workedMinutes % 60}min gearbeitet
          </p>
          <p>{monthSummary.daysWorked} Tage</p>
          <p>{monthSummary.kmTotal.toLocaleString("de-DE")} km gefahren</p>
        </div>
      </div>
    </div>
  );
}
