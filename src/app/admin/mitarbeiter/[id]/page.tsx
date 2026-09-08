import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { setEmployeeActive, resetEmployeePassword, deleteEmployee } from "@/actions/users";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: idParam } = await params;
  const { error } = await searchParams;
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
  const removeEmployee = deleteEmployee.bind(null, id);

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-6">
      <div>
        <h1 className="mb-2 text-xl font-semibold text-silver-light">{employee.name}</h1>
        <p className="mb-6 text-sm text-silver">
          {employee.username} · {employee.role === "admin" ? "Admin" : "Monteur"} ·{" "}
          {employee.active ? "Aktiv" : "Archiviert"}
        </p>

        {error === "has-history" && (
          <p className="mb-4 max-w-md text-sm text-danger">
            Dieser Mitarbeiter hat bereits Zeiten, Einsätze oder Einträge erfasst und kann
            deshalb nicht gelöscht werden - bitte stattdessen archivieren.
          </p>
        )}

        <div className="flex gap-3">
          <form action={toggleActive}>
            <button
              type="submit"
              className="rounded border border-border px-4 py-2 text-sm text-silver-light transition-colors hover:border-copper hover:text-copper-light"
            >
              {employee.active ? "Archivieren" : "Wieder aktivieren"}
            </button>
          </form>

          <form action={removeEmployee}>
            <ConfirmSubmitButton
              confirmMessage={`${employee.name} wirklich unwiderruflich löschen? Nur möglich, wenn noch keine Zeiten/Einsätze erfasst wurden.`}
              className="rounded border border-border px-4 py-2 text-sm text-silver transition-colors hover:border-danger hover:text-danger"
            >
              Löschen
            </ConfirmSubmitButton>
          </form>
        </div>
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
