import { sql } from "@/lib/db";
import { createAssignment, deleteAssignment } from "@/actions/assignments";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toTimeInputValue(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 5);
}

export default async function PlanningPage() {
  const [employees, projects, assignments] = await Promise.all([
    sql`SELECT id, name FROM users WHERE role = 'monteur' AND active = true ORDER BY name ASC`,
    sql`SELECT id, title FROM projects WHERE status NOT IN ('abgeschlossen', 'storniert') ORDER BY title ASC`,
    sql`
      SELECT a.id, a.date, a.start_time, a.end_time, a.note,
             u.name AS user_name, p.title AS project_title
      FROM assignments a
      JOIN users u ON u.id = a.user_id
      JOIN projects p ON p.id = a.project_id
      ORDER BY a.date DESC, a.start_time ASC NULLS LAST
    `,
  ]);

  const employeeList = employees as unknown as Array<{ id: number; name: string }>;
  const projectList = projects as unknown as Array<{ id: number; title: string }>;
  const assignmentList = assignments as unknown as Array<{
    id: number;
    date: unknown;
    start_time: unknown;
    end_time: unknown;
    note: string | null;
    user_name: string;
    project_title: string;
  }>;

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-6">
      <div>
        <h1 className="mb-6 text-xl font-semibold text-silver-light">Einsatzplanung</h1>
        <form action={createAssignment} className="flex max-w-lg flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="user_id">
              Mitarbeiter
            </label>
            <select
              id="user_id"
              name="user_id"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            >
              <option value="">– Auswählen –</option>
              {employeeList.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="project_id">
              Auftrag
            </label>
            <select
              id="project_id"
              name="project_id"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            >
              <option value="">– Auswählen –</option>
              {projectList.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="date">
              Datum
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="start_time">
                Von
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="end_time">
                Bis
              </label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="note">
              Notiz
            </label>
            <input
              id="note"
              name="note"
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Einteilen
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-silver-light">Geplante Einsätze</h2>
        {assignmentList.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Einsätze geplant.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-silver">
                <tr>
                  <th className="px-4 py-3 font-medium">Datum</th>
                  <th className="px-4 py-3 font-medium">Mitarbeiter</th>
                  <th className="px-4 py-3 font-medium">Auftrag</th>
                  <th className="px-4 py-3 font-medium">Zeit</th>
                  <th className="px-4 py-3 font-medium">Notiz</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {assignmentList.map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-silver">{toDateInputValue(assignment.date)}</td>
                    <td className="px-4 py-3 text-silver-light">{assignment.user_name}</td>
                    <td className="px-4 py-3 text-silver-light">{assignment.project_title}</td>
                    <td className="px-4 py-3 text-silver">
                      {toTimeInputValue(assignment.start_time)}
                      {assignment.end_time ? `–${toTimeInputValue(assignment.end_time)}` : ""}
                    </td>
                    <td className="px-4 py-3 text-silver">{assignment.note ?? "–"}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={deleteAssignment.bind(null, assignment.id)}>
                        <button
                          type="submit"
                          className="text-xs text-silver hover:text-danger"
                        >
                          Entfernen
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
