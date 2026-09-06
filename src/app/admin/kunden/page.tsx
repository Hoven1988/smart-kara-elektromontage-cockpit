import Link from "next/link";
import { sql } from "@/lib/db";

type Customer = {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
};

export default async function CustomersPage() {
  const customers = (await sql`
    SELECT id, name, contact_person, phone, email
    FROM customers
    ORDER BY name ASC
  `) as unknown as Customer[];

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Kunden</h1>
        <Link
          href="/admin/kunden/neu"
          className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Neuer Kunde
        </Link>
      </div>

      {customers.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Kunden angelegt.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Ansprechpartner</th>
                <th className="px-4 py-3 font-medium">Telefon</th>
                <th className="px-4 py-3 font-medium">E-Mail</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/kunden/${customer.id}`}
                      className="text-silver-light hover:text-copper-light"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-silver">{customer.contact_person ?? "–"}</td>
                  <td className="px-4 py-3 text-silver">{customer.phone ?? "–"}</td>
                  <td className="px-4 py-3 text-silver">{customer.email ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
