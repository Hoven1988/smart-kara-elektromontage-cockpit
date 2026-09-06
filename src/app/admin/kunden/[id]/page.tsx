import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { updateCustomer } from "@/actions/customers";
import { CustomerForm } from "@/components/customer-form";
import { PROJECT_STATUS_LABELS, parseProjectStatus } from "@/lib/project-status";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const customers = (await sql`
    SELECT id, name, contact_person, email, phone, address, notes
    FROM customers
    WHERE id = ${id}
  `) as unknown as Array<{
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
  }>;

  const customer = customers[0];
  if (!customer) notFound();

  const projects = (await sql`
    SELECT id, title, status
    FROM projects
    WHERE customer_id = ${id}
    ORDER BY created_at DESC
  `) as unknown as Array<{ id: number; title: string; status: string }>;

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-6">
      <div>
        <h1 className="mb-6 text-xl font-semibold text-silver-light">{customer.name}</h1>
        <CustomerForm
          action={updateCustomer.bind(null, id)}
          defaultValues={customer}
          submitLabel="Speichern"
        />
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-silver-light">Aufträge</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Aufträge für diesen Kunden.</p>
        ) : (
          <ul className="flex max-w-lg flex-col gap-2">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/admin/auftraege/${project.id}`}
                  className="flex items-center justify-between rounded border border-border px-4 py-2 text-sm hover:border-copper"
                >
                  <span className="text-silver-light">{project.title}</span>
                  <span className="text-silver">
                    {PROJECT_STATUS_LABELS[parseProjectStatus(project.status)]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
