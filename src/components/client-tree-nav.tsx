import { sql } from "@/lib/db";
import { ClientTreeNavClient } from "@/components/client-tree-nav-client";

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

  const customerList = [...customers.entries()].map(([id, c]) => ({ id, name: c.name, projects: c.projects }));

  return <ClientTreeNavClient customers={customerList} unassigned={unassigned} />;
}
