import Link from "next/link";
import { sql } from "@/lib/db";

type Employee = {
  id: number;
  name: string;
  username: string;
  role: "admin" | "monteur";
  active: boolean;
};

export default async function EmployeesPage() {
  const employees = (await sql`
    SELECT id, name, username, role, active
    FROM users
    ORDER BY role ASC, name ASC
  `) as unknown as Employee[];

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Mitarbeiter</h1>
        <Link
          href="/admin/mitarbeiter/neu"
          className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Neuer Mitarbeiter
        </Link>
      </div>

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-silver">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Benutzername</th>
              <th className="px-4 py-3 font-medium">Rolle</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/mitarbeiter/${employee.id}`}
                    className="text-silver-light hover:text-copper-light"
                  >
                    {employee.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-silver">{employee.username}</td>
                <td className="px-4 py-3 text-silver">
                  {employee.role === "admin" ? "Admin" : "Monteur"}
                </td>
                <td className="px-4 py-3 text-silver">
                  {employee.active ? "Aktiv" : "Archiviert"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
