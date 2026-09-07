import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function MonteurHome() {
  const user = await getCurrentUser();
  if (!user) return null;

  const assignments = (await sql`
    SELECT a.id, a.date, a.start_time, a.end_time, p.id AS project_id, p.title, p.address, p.status
    FROM assignments a
    JOIN projects p ON p.id = a.project_id
    WHERE a.user_id = ${user.userId}
    ORDER BY a.date ASC
  `) as unknown as Array<{
    id: number;
    date: unknown;
    start_time: unknown;
    end_time: unknown;
    project_id: number;
    title: string;
    address: string | null;
    status: string;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Meine Aufträge</h1>
      {assignments.length === 0 ? (
        <p className="text-sm text-silver">Dir sind aktuell keine Aufträge zugewiesen.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <Link
                href={`/auftrag/${assignment.project_id}`}
                className="flex flex-col gap-1 rounded border border-border px-4 py-3 hover:border-copper"
              >
                <span className="font-medium text-silver-light">{assignment.title}</span>
                <span className="text-sm text-silver">
                  {toDateInputValue(assignment.date)}
                  {assignment.address ? ` · ${assignment.address}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
