import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { setEmployeeActive, resetEmployeePassword } from "@/actions/users";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const rows = (await sql`
    SELECT id, name, username, role, active
    FROM users
    WHERE id = ${id}
  `) as unknown as Array<{
    id: number;
    name: string;
    username: string;
    role: "admin" | "monteur";
    active: boolean;
  }>;

  const employee = rows[0];
  if (!employee) notFound();

  const toggleActive = setEmployeeActive.bind(null, id, !employee.active);
  const resetPassword = resetEmployeePassword.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-6">
      <div>
        <h1 className="mb-2 text-xl font-semibold text-silver-light">{employee.name}</h1>
        <p className="mb-6 text-sm text-silver">
          {employee.username} · {employee.role === "admin" ? "Admin" : "Monteur"} ·{" "}
          {employee.active ? "Aktiv" : "Deaktiviert"}
        </p>

        <form action={toggleActive}>
          <button
            type="submit"
            className="rounded border border-border px-4 py-2 text-sm text-silver-light transition-colors hover:border-copper hover:text-copper-light"
          >
            {employee.active ? "Deaktivieren" : "Aktivieren"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-silver-light">Passwort zurücksetzen</h2>
        <form action={resetPassword} className="flex max-w-sm flex-col gap-4">
          <input
            name="password"
            required
            placeholder="Neues Passwort"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Passwort setzen
          </button>
        </form>
      </div>
    </div>
  );
}
