import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { updateProject } from "@/actions/projects";
import { ProjectForm } from "@/components/project-form";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [projects, customers] = await Promise.all([
    sql`
      SELECT id, title, customer_id, address, status, description, start_date, end_date
      FROM projects
      WHERE id = ${id}
    `,
    sql`SELECT id, name FROM customers ORDER BY name ASC`,
  ]);

  const project = (
    projects as unknown as Array<{
      id: number;
      title: string;
      customer_id: number | null;
      address: string | null;
      status: string;
      description: string | null;
      start_date: unknown;
      end_date: unknown;
    }>
  )[0];
  if (!project) notFound();

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">{project.title}</h1>
      <ProjectForm
        action={updateProject.bind(null, id)}
        customers={customers as unknown as Array<{ id: number; name: string }>}
        defaultValues={{
          ...project,
          start_date: toDateInputValue(project.start_date),
          end_date: toDateInputValue(project.end_date),
        }}
        submitLabel="Speichern"
      />
    </div>
  );
}
