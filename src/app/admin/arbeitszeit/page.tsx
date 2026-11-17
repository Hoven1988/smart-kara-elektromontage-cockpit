import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { clockIn, clockOut } from "@/actions/time";
import { closeExpiredTimeEntries } from "@/lib/worktime";

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

export default async function AdminArbeitszeitPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  await closeExpiredTimeEntries();

  const [openEntryRows, customerRows] = await Promise.all([
    sql`
      SELECT t.started_at, t.project_id, p.title AS project_title, c.name AS customer_name
      FROM time_entries t
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE t.user_id = ${user.userId} AND t.ended_at IS NULL
    `,
    sql`SELECT id, name FROM customers ORDER BY name ASC`,
  ]);
  const openEntry = (
    openEntryRows as unknown as Array<{
      started_at: unknown;
      project_id: number | null;
      project_title: string | null;
      customer_name: string | null;
    }>
  )[0];
  const customers = customerRows as unknown as Array<{ id: number; name: string }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Meine Arbeitszeit</h1>

      <div className="max-w-sm">
        {openEntry ? (
          <form action={clockOut.bind(null, openEntry.project_id)} className="flex flex-col gap-3">
            <p className="text-sm text-silver">
              Eingestempelt seit {toDateTimeLabel(openEntry.started_at)}
              {" · "}
              {openEntry.project_id ? openEntry.project_title : openEntry.customer_name ?? "Allgemein"}
            </p>
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
            <p className="text-xs text-silver">Pause wird automatisch nach Arbeitszeitgesetz abgezogen.</p>
          </form>
        ) : (
          <form action={clockIn.bind(null, null)} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="customer_id">
                Kunde
              </label>
              <select
                id="customer_id"
                name="customer_id"
                defaultValue=""
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              >
                <option value="">– Auswählen (optional) –</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="note">
                Baustelle
              </label>
              <input
                id="note"
                name="note"
                placeholder="z.B. Münster, Musterstraße 1"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="km_driven">
                Gefahrene km
              </label>
              <input
                id="km_driven"
                name="km_driven"
                type="number"
                min={0}
                step="0.1"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
            >
              Einstempeln
            </button>
          </form>
        )}
      </div>

      <p className="mt-6 text-sm text-silver">
        Alle erfassten Zeiten findest du unter Personal → Zeiten.
      </p>
    </div>
  );
}
