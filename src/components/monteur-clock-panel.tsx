import { clockIn, clockOut } from "@/actions/time";
import { MonteurCalendar } from "@/components/monteur-calendar";

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export function MonteurClockPanel({
  openEntry,
  customers,
  assignmentDates,
}: {
  openEntry: {
    started_at: unknown;
    project_id: number | null;
    project_title: string | null;
  } | null;
  customers: Array<{ id: number; name: string }>;
  assignmentDates: string[];
}) {
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

      <MonteurCalendar assignmentDates={assignmentDates} />
    </div>
  );
}
