import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { createOwnTimeEntry } from "@/actions/time";

export default async function NewOwnTimeEntryPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [projectRows, customerRows] = await Promise.all([
    sql`
      SELECT DISTINCT p.id, p.title
      FROM assignments a
      JOIN projects p ON p.id = a.project_id
      WHERE a.user_id = ${user.userId}
      ORDER BY p.title ASC
    `,
    sql`SELECT id, name FROM customers ORDER BY name ASC`,
  ]);
  const projects = projectRows as unknown as Array<{ id: number; title: string }>;
  const customers = customerRows as unknown as Array<{ id: number; name: string }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Zeit eintragen</h1>
      <form action={createOwnTimeEntry} className="flex max-w-lg flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="project_id">
            Auftrag
          </label>
          <select
            id="project_id"
            name="project_id"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          >
            <option value="">Allgemein (kein Auftrag)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="customer_id">
            Kunde
          </label>
          <select
            id="customer_id"
            name="customer_id"
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
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-sm text-silver" htmlFor="km_driven">
              Km
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
        </div>
        <p className="text-xs text-silver">Pause wird automatisch nach Arbeitszeitgesetz berechnet (ab 6h: 30 min, ab 9h: 45 min).</p>

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
    </div>
  );
}
