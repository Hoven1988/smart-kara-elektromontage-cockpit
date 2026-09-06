import Link from "next/link";
import { sql } from "@/lib/db";
import { PROJECT_STATUS_LABELS, parseProjectStatus } from "@/lib/project-status";

type ProjectRow = {
  id: number;
  title: string;
  status: string;
  address: string | null;
  customer_name: string | null;
};

export default async function ProjectsPage() {
  const projects = (await sql`
    SELECT p.id, p.title, p.status, p.address, c.name AS customer_name
    FROM projects p
    LEFT JOIN customers c ON c.id = p.customer_id
    ORDER BY p.created_at DESC
  `) as unknown as ProjectRow[];

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Aufträge</h1>
        <Link
          href="/admin/auftraege/neu"
          className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Neuer Auftrag
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Aufträge angelegt.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Titel</th>
                <th className="px-4 py-3 font-medium">Kunde</th>
                <th className="px-4 py-3 font-medium">Adresse</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/auftraege/${project.id}`}
                      className="text-silver-light hover:text-copper-light"
                    >
                      {project.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-silver">{project.customer_name ?? "–"}</td>
                  <td className="px-4 py-3 text-silver">{project.address ?? "–"}</td>
                  <td className="px-4 py-3 text-silver">
                    {PROJECT_STATUS_LABELS[parseProjectStatus(project.status)]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
