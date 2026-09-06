import { sql } from "@/lib/db";
import { createProject } from "@/actions/projects";
import { ProjectForm } from "@/components/project-form";

export default async function NewProjectPage() {
  const customers = (await sql`
    SELECT id, name FROM customers ORDER BY name ASC
  `) as unknown as Array<{ id: number; name: string }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Neuer Auftrag</h1>
      <ProjectForm action={createProject} customers={customers} submitLabel="Auftrag anlegen" />
    </div>
  );
}
