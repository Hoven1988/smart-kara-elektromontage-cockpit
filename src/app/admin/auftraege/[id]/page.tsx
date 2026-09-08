import Image from "next/image";
import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { updateProject } from "@/actions/projects";
import { ProjectForm } from "@/components/project-form";
import { createServiceEntry } from "@/actions/service";
import { createMaterialEntry } from "@/actions/material";
import { uploadProjectPhoto, addProjectNote } from "@/actions/docs";

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

function toTimestamp(value: unknown): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(String(value));
  return date.getTime();
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

function TypeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs text-silver">
      {children}
    </span>
  );
}

type TimelineEvent = {
  key: string;
  timestamp: unknown;
  content: React.ReactNode;
};

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

  const timeline: TimelineEvent[] = [
    ...timeEntries.map((entry) => ({
      key: `time-${entry.id}`,
      timestamp: entry.started_at,
      content: (
        <>
          <TypeBadge>Zeit</TypeBadge>
          <span className="text-silver-light">{entry.user_name}</span>{" "}
          <span className="text-silver">
            – {toDateTimeLabel(entry.started_at)} ·{" "}
            {minutesLabel(durationMinutes(entry.started_at, entry.ended_at, entry.break_minutes))}
            {entry.note ? ` · ${entry.note}` : ""}
          </span>
        </>
      ),
    })),
    ...serviceEntries.map((entry) => ({
      key: `service-${entry.id}`,
      timestamp: entry.created_at,
      content: (
        <>
          <TypeBadge>Arbeit</TypeBadge>
          <span className="text-silver-light">{entry.description}</span>{" "}
          <span className="text-silver">
            {entry.note ? `· ${entry.note} ` : ""}· {entry.user_name}, {toDateTimeLabel(entry.created_at)}
          </span>
        </>
      ),
    })),
    ...materialEntries.map((entry) => ({
      key: `material-${entry.id}`,
      timestamp: entry.created_at,
      content: (
        <>
          <TypeBadge>Material</TypeBadge>
          <span className="text-silver-light">{entry.description}</span>{" "}
          <span className="text-silver">
            {entry.quantity != null && `· ${entry.quantity}${entry.unit ? ` ${entry.unit}` : ""}`}
            {entry.note ? ` · ${entry.note}` : ""} · {entry.user_name}, {toDateTimeLabel(entry.created_at)}
          </span>
        </>
      ),
    })),
    ...docEntries.map((entry) => ({
      key: `doc-${entry.id}`,
      timestamp: entry.created_at,
      content: (
        <>
          <TypeBadge>{entry.type === "photo" ? "Foto" : "Notiz"}</TypeBadge>
          {entry.type === "photo" && entry.blob_url && (
            <Image
              src={entry.blob_url}
              alt={entry.text ?? "Baustellenfoto"}
              width={480}
              height={360}
              className="mt-2 mb-2 h-auto w-full max-w-xs rounded"
            />
          )}
          {entry.text && <span className="text-silver-light">{entry.text}</span>}{" "}
          <span className="text-silver">
            · {entry.user_name}, {toDateTimeLabel(entry.created_at)}
          </span>
        </>
      ),
    })),
  ].sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp));

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-6">
      <div>
        <h1 className="mb-1 text-xl font-semibold text-silver-light">{project.title}</h1>
        {timeEntries.length > 0 && (
          <p className="mb-4 text-sm text-silver">Gesamtzeit: {minutesLabel(totalMinutes)}</p>
        )}

        <details className="rounded border border-border">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
            Auftragsdetails bearbeiten
          </summary>
          <div className="border-t border-border p-4">
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
        </details>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Neuer Eintrag</h2>
        <div className="flex max-w-2xl flex-wrap gap-3">
          <details className="flex-1 min-w-64 rounded border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
              Geleistete Arbeit
            </summary>
            <form
              action={createServiceEntry.bind(null, id)}
              className="flex flex-col gap-3 border-t border-border p-4"
            >
              <input type="hidden" name="_redirect" value={`/admin/auftraege/${id}`} />
              <textarea
                name="description"
                required
                rows={2}
                placeholder="Was wurde gemacht?"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <input
                name="note"
                placeholder="Notiz (optional)"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <button
                type="submit"
                className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
              >
                Erfassen
              </button>
            </form>
          </details>

          <details className="flex-1 min-w-64 rounded border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
              Material
            </summary>
            <form
              action={createMaterialEntry.bind(null, id)}
              className="flex flex-col gap-3 border-t border-border p-4"
            >
              <input type="hidden" name="_redirect" value={`/admin/auftraege/${id}`} />
              <input
                name="description"
                required
                placeholder="Was wurde verbaut?"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <div className="flex gap-2">
                <input
                  name="quantity"
                  type="text"
                  inputMode="decimal"
                  placeholder="Menge"
                  className="w-20 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
                />
                <input
                  name="unit"
                  placeholder="Einheit"
                  className="flex-1 rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
                />
              </div>
              <input
                name="note"
                placeholder="Notiz (optional)"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <button
                type="submit"
                className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
              >
                Erfassen
              </button>
            </form>
          </details>

          <details className="flex-1 min-w-64 rounded border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
              Foto
            </summary>
            <form
              action={uploadProjectPhoto.bind(null, id)}
              className="flex flex-col gap-3 border-t border-border p-4"
            >
              <input type="hidden" name="_redirect" value={`/admin/auftraege/${id}`} />
              <input
                type="file"
                name="photo"
                accept="image/*"
                required
                className="text-sm text-silver file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-2 file:text-xs file:font-medium file:text-background hover:file:bg-copper-light"
              />
              <input
                name="text"
                placeholder="Bildunterschrift (optional)"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <button
                type="submit"
                className="self-start rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
              >
                Hochladen
              </button>
            </form>
          </details>

          <details className="flex-1 min-w-64 rounded border border-border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-silver-light">
              Notiz
            </summary>
            <form
              action={addProjectNote.bind(null, id)}
              className="flex flex-col gap-3 border-t border-border p-4"
            >
              <input type="hidden" name="_redirect" value={`/admin/auftraege/${id}`} />
              <textarea
                name="text"
                required
                rows={2}
                placeholder="Notiz…"
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-copper"
              />
              <button
                type="submit"
                className="self-start rounded border border-border px-3 py-1.5 text-xs text-silver-light transition-colors hover:border-copper hover:text-copper-light"
              >
                Hinzufügen
              </button>
            </form>
          </details>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Akte / Verlauf</h2>
        {timeline.length === 0 ? (
          <p className="text-sm text-silver">
            Noch nichts erfasst – Zeiten, Arbeit, Material und Fotos erscheinen hier chronologisch.
          </p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {timeline.map((event) => (
              <li key={event.key} className="rounded border border-border px-4 py-2 text-sm">
                {event.content}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
