import Image from "next/image";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { updateProject } from "@/actions/projects";
import { ProjectForm } from "@/components/project-form";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function durationMinutes(start: unknown, end: unknown, breakMinutes: number): number {
  if (!start || !end) return 0;
  const startDate = start instanceof Date ? start : new Date(String(start));
  const endDate = end instanceof Date ? end : new Date(String(end));
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000) - breakMinutes);
}

function minutesLabel(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [projects, customers, timeRows, serviceRows, materialRows, docRows] = await Promise.all([
    sql`
      SELECT id, title, customer_id, address, status, description, start_date, end_date
      FROM projects
      WHERE id = ${id}
    `,
    sql`SELECT id, name FROM customers ORDER BY name ASC`,
    sql`
      SELECT t.id, t.started_at, t.ended_at, t.break_minutes, t.note, u.name AS user_name
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      WHERE t.project_id = ${id}
      ORDER BY t.started_at DESC
    `,
    sql`
      SELECT s.id, s.description, s.note, s.created_at, u.name AS user_name
      FROM service_entries s
      JOIN users u ON u.id = s.user_id
      WHERE s.project_id = ${id}
      ORDER BY s.created_at DESC
    `,
    sql`
      SELECT m.id, m.description, m.quantity, m.unit, m.note, m.created_at, u.name AS user_name
      FROM material_entries m
      JOIN users u ON u.id = m.user_id
      WHERE m.project_id = ${id}
      ORDER BY m.created_at DESC
    `,
    sql`
      SELECT d.id, d.type, d.blob_url, d.text, d.created_at, u.name AS user_name
      FROM doc_entries d
      JOIN users u ON u.id = d.user_id
      WHERE d.project_id = ${id}
      ORDER BY d.created_at DESC
    `,
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

  const timeEntries = timeRows as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
    user_name: string;
  }>;
  const totalMinutes = timeEntries.reduce(
    (sum, e) => sum + durationMinutes(e.started_at, e.ended_at, e.break_minutes),
    0
  );

  const serviceEntries = serviceRows as unknown as Array<{
    id: number;
    description: string;
    note: string | null;
    created_at: unknown;
    user_name: string;
  }>;

  const materialEntries = materialRows as unknown as Array<{
    id: number;
    description: string;
    quantity: number | null;
    unit: string | null;
    note: string | null;
    created_at: unknown;
    user_name: string;
  }>;

  const docEntries = docRows as unknown as Array<{
    id: number;
    type: "photo" | "note" | "measurement";
    blob_url: string | null;
    text: string | null;
    created_at: unknown;
    user_name: string;
  }>;

  return (
    <div className="flex flex-1 flex-col gap-10 px-6 py-6">
      <div>
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

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">
          Zeiten {timeEntries.length > 0 && `· gesamt ${minutesLabel(totalMinutes)}`}
        </h2>
        {timeEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Zeiten erfasst.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {timeEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border px-4 py-2 text-sm">
                <span className="text-silver-light">{entry.user_name}</span>{" "}
                <span className="text-silver">
                  – {toDateTimeLabel(entry.started_at)} ·{" "}
                  {minutesLabel(durationMinutes(entry.started_at, entry.ended_at, entry.break_minutes))}
                  {entry.note ? ` · ${entry.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Geleistete Arbeit</h2>
        {serviceEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Arbeit erfasst.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {serviceEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border px-4 py-2 text-sm">
                <span className="text-silver-light">{entry.description}</span>{" "}
                <span className="text-silver">
                  {entry.note ? `· ${entry.note} ` : ""}· {entry.user_name},{" "}
                  {toDateTimeLabel(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Material</h2>
        {materialEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch kein Material erfasst.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {materialEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border px-4 py-2 text-sm">
                <span className="text-silver-light">{entry.description}</span>{" "}
                <span className="text-silver">
                  {entry.quantity != null && `· ${entry.quantity}${entry.unit ? ` ${entry.unit}` : ""}`}
                  {entry.note ? ` · ${entry.note}` : ""} · {entry.user_name},{" "}
                  {toDateTimeLabel(entry.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Fotos &amp; Notizen</h2>
        {docEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Fotos oder Notizen.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-3">
            {docEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border p-3 text-sm">
                {entry.type === "photo" && entry.blob_url && (
                  <Image
                    src={entry.blob_url}
                    alt={entry.text ?? "Baustellenfoto"}
                    width={480}
                    height={360}
                    className="mb-2 h-auto w-full max-w-xs rounded"
                  />
                )}
                {entry.text && <p className="text-silver-light">{entry.text}</p>}
                <p className="mt-1 text-xs text-silver">
                  {entry.user_name}, {toDateTimeLabel(entry.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
