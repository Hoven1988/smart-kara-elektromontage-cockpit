import Link from "next/link";
import { sql } from "@/lib/db";

type Row = {
  customer_id: number | null;
  customer_name: string | null;
  project_id: number | null;
  project_title: string | null;
};

export async function ClientTreeNav() {
  const rows = (await sql`
    SELECT c.id AS customer_id, c.name AS customer_name, p.id AS project_id, p.title AS project_title
    FROM customers c
    LEFT JOIN projects p ON p.customer_id = c.id
    ORDER BY c.name ASC, p.title ASC
  `) as unknown as Row[];

  const unassigned = (await sql`
    SELECT id, title FROM projects WHERE customer_id IS NULL ORDER BY title ASC
  `) as unknown as Array<{ id: number; title: string }>;

  const customers = new Map<number, { name: string; projects: Array<{ id: number; title: string }> }>();
  for (const row of rows) {
    if (row.customer_id === null) continue;
    if (!customers.has(row.customer_id)) {
      customers.set(row.customer_id, { name: row.customer_name ?? "", projects: [] });
    }
    if (row.project_id !== null) {
      customers.get(row.customer_id)!.projects.push({ id: row.project_id, title: row.project_title ?? "" });
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Link
        href="/admin/kunden"
        className="rounded px-3 py-2 text-sm text-silver transition-colors hover:bg-card hover:text-silver-light"
      >
        Auftraggeber
      </Link>
      <div className="flex flex-col">
        {[...customers.entries()].map(([customerId, customer]) => (
          <div key={customerId}>
            <Link
              href={`/admin/kunden/${customerId}`}
              className="block truncate rounded px-3 py-1.5 text-sm text-silver-light transition-colors hover:bg-card"
            >
              {customer.name}
            </Link>
            <div className="ml-3 flex flex-col border-l border-border pl-3">
              {customer.projects.length === 0 ? (
                <span className="px-2 py-1 text-xs text-silver">Keine Projekte</span>
              ) : (
                customer.projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/admin/auftraege/${project.id}`}
                    className="truncate rounded px-2 py-1 text-xs text-silver transition-colors hover:bg-card hover:text-silver-light"
                  >
                    {project.title}
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <div>
          <p className="px-3 py-1.5 text-sm text-silver">Ohne Auftraggeber</p>
          <div className="ml-3 flex flex-col border-l border-border pl-3">
            {unassigned.map((project) => (
              <Link
                key={project.id}
                href={`/admin/auftraege/${project.id}`}
                className="truncate rounded px-2 py-1 text-xs text-silver transition-colors hover:bg-card hover:text-silver-light"
              >
                {project.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
