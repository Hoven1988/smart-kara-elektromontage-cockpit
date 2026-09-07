import Image from "next/image";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { clockIn, clockOut } from "@/actions/time";
import { createMaterialEntry } from "@/actions/material";
import { createServiceEntry } from "@/actions/service";
import { uploadProjectPhoto, addProjectNote } from "@/actions/docs";

function toDateTimeLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function durationLabel(start: unknown, end: unknown, breakMinutes: number): string {
  if (!start || !end) return "läuft…";
  const startDate = start instanceof Date ? start : new Date(String(start));
  const endDate = end instanceof Date ? end : new Date(String(end));
  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000) - breakMinutes);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}min`;
}

export default async function MonteurProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const projectId = Number(idParam);
  if (!Number.isInteger(projectId)) notFound();

  const user = await getCurrentUser();
  if (!user) return null;

  const projects = (await sql`
    SELECT id, title, address, description, status
    FROM projects
    WHERE id = ${projectId}
  `) as unknown as Array<{
    id: number;
    title: string;
    address: string | null;
    description: string | null;
    status: string;
  }>;
  const project = projects[0];
  if (!project) notFound();

  if (user.role !== "admin") {
    const assignmentCheck = await sql`
      SELECT 1 FROM assignments WHERE project_id = ${projectId} AND user_id = ${user.userId} LIMIT 1
    `;
    if ((assignmentCheck as unknown as unknown[]).length === 0) {
      return (
        <div className="flex flex-1 flex-col px-6 py-6">
          <p className="text-sm text-silver">Dir ist dieser Auftrag nicht zugewiesen.</p>
        </div>
      );
    }
  }

  const openEntryRows = await sql`
    SELECT id, started_at FROM time_entries
    WHERE user_id = ${user.userId} AND project_id = ${projectId} AND ended_at IS NULL
  `;
  const openEntry = (openEntryRows as unknown as Array<{ id: number; started_at: unknown }>)[0];

  const [ownEntriesRows, serviceRows, materialRows, docRows] = await Promise.all([
    sql`
      SELECT id, started_at, ended_at, break_minutes, note
      FROM time_entries
      WHERE user_id = ${user.userId} AND project_id = ${projectId}
      ORDER BY started_at DESC
    `,
    sql`
      SELECT s.id, s.description, s.note, s.created_at, u.name AS user_name
      FROM service_entries s
      JOIN users u ON u.id = s.user_id
      WHERE s.project_id = ${projectId}
      ORDER BY s.created_at DESC
    `,
    sql`
      SELECT m.id, m.description, m.quantity, m.unit, m.note, m.created_at, u.name AS user_name
      FROM material_entries m
      JOIN users u ON u.id = m.user_id
      WHERE m.project_id = ${projectId}
      ORDER BY m.created_at DESC
    `,
    sql`
      SELECT d.id, d.type, d.blob_url, d.text, d.created_at, u.name AS user_name
      FROM doc_entries d
      JOIN users u ON u.id = d.user_id
      WHERE d.project_id = ${projectId}
      ORDER BY d.created_at DESC
    `,
  ]);

  const ownEntries = ownEntriesRows as unknown as Array<{
    id: number;
    started_at: unknown;
    ended_at: unknown;
    break_minutes: number;
    note: string | null;
  }>;

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
        <h1 className="mb-1 text-xl font-semibold text-silver-light">{project.title}</h1>
        {project.address && <p className="mb-4 text-sm text-silver">{project.address}</p>}
        {project.description && (
          <p className="mb-6 max-w-lg text-sm text-silver">{project.description}</p>
        )}

        <div className="mb-8">
          {openEntry ? (
            <form action={clockOut.bind(null, projectId)} className="flex max-w-sm flex-col gap-3">
              <p className="text-sm text-silver">
                Eingestempelt seit {toDateTimeLabel(openEntry.started_at)}
              </p>
              <div>
                <label className="mb-1 block text-sm text-silver" htmlFor="break_minutes">
                  Pause (Minuten)
                </label>
                <input
                  id="break_minutes"
                  name="break_minutes"
                  type="number"
                  min={0}
                  defaultValue={0}
                  className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
                />
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
                Ausstempeln
              </button>
            </form>
          ) : (
            <form action={clockIn.bind(null, projectId)}>
              <button
                type="submit"
                className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
              >
                Einstempeln
              </button>
            </form>
          )}
        </div>

        <h2 className="mb-3 text-lg font-semibold text-silver-light">Meine Zeiten hier</h2>
        {ownEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Zeiten erfasst.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {ownEntries.map((entry) => (
              <li key={entry.id} className="rounded border border-border px-4 py-2 text-sm">
                <span className="text-silver-light">{toDateTimeLabel(entry.started_at)}</span>{" "}
                <span className="text-silver">
                  – {durationLabel(entry.started_at, entry.ended_at, entry.break_minutes)}
                  {entry.note ? ` · ${entry.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Geleistete Arbeit</h2>
        <form
          action={createServiceEntry.bind(null, projectId)}
          className="mb-4 flex max-w-lg flex-col gap-3"
        >
          <textarea
            name="description"
            required
            rows={2}
            placeholder="Was wurde gemacht? (z.B. Zählerschrank ausgetauscht, 3 Steckdosen gesetzt)"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
          <input
            name="note"
            placeholder="Notiz (optional)"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Arbeit erfassen
          </button>
        </form>

        {serviceEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Arbeit erfasst.</p>
        ) : (
          <ul className="flex flex-col gap-2">
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
        <form
          action={createMaterialEntry.bind(null, projectId)}
          className="mb-4 flex max-w-lg flex-col gap-3"
        >
          <input
            name="description"
            required
            placeholder="Was wurde verbaut? (z.B. Kabel NYM 3x1,5)"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
          <div className="flex gap-3">
            <input
              name="quantity"
              type="text"
              inputMode="decimal"
              placeholder="Menge"
              className="w-24 rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
            <input
              name="unit"
              placeholder="Einheit (z.B. m, Stk.)"
              className="flex-1 rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>
          <input
            name="note"
            placeholder="Notiz (optional)"
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Material erfassen
          </button>
        </form>

        {materialEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch kein Material erfasst.</p>
        ) : (
          <ul className="flex flex-col gap-2">
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

        <div className="mb-4 flex flex-col gap-6 sm:flex-row">
          <form
            action={uploadProjectPhoto.bind(null, projectId)}
            className="flex flex-1 flex-col gap-2"
          >
            <input
              type="file"
              name="photo"
              accept="image/*"
              capture="environment"
              required
              className="text-sm text-silver file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-2 file:text-sm file:font-medium file:text-background hover:file:bg-copper-light"
            />
            <input
              name="text"
              placeholder="Bildunterschrift (optional)"
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
            <button
              type="submit"
              className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
            >
              Foto hochladen
            </button>
          </form>

          <form action={addProjectNote.bind(null, projectId)} className="flex flex-1 flex-col gap-2">
            <textarea
              name="text"
              required
              rows={3}
              placeholder="Notiz zur Baustelle…"
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
            <button
              type="submit"
              className="self-start rounded border border-border px-4 py-2 text-sm text-silver-light transition-colors hover:border-copper hover:text-copper-light"
            >
              Notiz hinzufügen
            </button>
          </form>
        </div>

        {docEntries.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Fotos oder Notizen.</p>
        ) : (
          <ul className="flex flex-col gap-3">
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
