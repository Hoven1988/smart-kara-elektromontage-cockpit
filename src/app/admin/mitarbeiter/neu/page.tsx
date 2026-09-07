import { redirect } from "next/navigation";
import { createEmployee } from "@/actions/users";

async function createAndRedirect(formData: FormData) {
  "use server";
  await createEmployee(formData);
  redirect("/admin/mitarbeiter");
}

export default function NewEmployeePage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Neuer Mitarbeiter</h1>
      <form action={createAndRedirect} className="flex max-w-lg flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="username">
            Benutzername
          </label>
          <input
            id="username"
            name="username"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="password">
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="text"
            required
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="role">
            Rolle
          </label>
          <select
            id="role"
            name="role"
            defaultValue="monteur"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          >
            <option value="monteur">Monteur</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Mitarbeiter anlegen
        </button>
      </form>
    </div>
  );
}
