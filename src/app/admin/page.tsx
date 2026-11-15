import Link from "next/link";
import { sql } from "@/lib/db";
import { fetchNordwaldeWeather } from "@/lib/weather";
import {
  getNextUstVaDeadline,
  getWageDueDate,
  getNextTuvDue,
  isTuvDueSoon,
  isTuvOverdue,
  getTireChangeReminder,
} from "@/lib/deadlines";

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

function toTimeLabel(value: unknown): string {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function toTimeSinceLabel(value: unknown): string {
  if (!value) return "";
  const started = value instanceof Date ? value : new Date(String(value));
  return started.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
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

function TypeBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-xs text-silver">
      {children}
    </span>
  );
}

type ActivityEvent = {
  key: string;
  timestamp: unknown;
  content: React.ReactNode;
};

export default async function AdminDashboard() {
  const now = new Date();
  const today = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ustVaDeadline = getNextUstVaDeadline(now);
  const wageDueDate = getWageDueDate(now);
  const tireChangeReminder = getTireChangeReminder(now);

  const [
    weather,
    vehicleRows,
    todaysAssignments,
    clockedIn,
    recentTime,
    recentService,
    recentMaterial,
    recentDocs,
  ] = await Promise.all([
      fetchNordwaldeWeather(),
      sql`SELECT id, license_plate, vehicle_type, last_tuv, tire_type FROM vehicles ORDER BY license_plate ASC`,
      sql`
      SELECT a.id, u.name AS user_name, p.id AS project_id, p.title AS project_title,
             a.start_time, a.end_time, a.note
      FROM assignments a
      JOIN users u ON u.id = a.user_id
      JOIN projects p ON p.id = a.project_id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.start_time ASC NULLS LAST, u.name ASC
    `,
      sql`
      SELECT t.id, u.name AS user_name, p.id AS project_id, p.title AS project_title, t.started_at
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN projects p ON p.id = t.project_id
      WHERE t.ended_at IS NULL
      ORDER BY t.started_at ASC
    `,
      sql`
      SELECT t.id, t.started_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.started_at DESC
      LIMIT 20
    `,
      sql`
      SELECT s.id, s.description, s.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM service_entries s
      JOIN users u ON u.id = s.user_id
      JOIN projects p ON p.id = s.project_id
      ORDER BY s.created_at DESC
      LIMIT 20
    `,
      sql`
      SELECT m.id, m.description, m.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM material_entries m
      JOIN users u ON u.id = m.user_id
      JOIN projects p ON p.id = m.project_id
      ORDER BY m.created_at DESC
      LIMIT 20
    `,
      sql`
      SELECT d.id, d.type, d.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM doc_entries d
      JOIN users u ON u.id = d.user_id
      JOIN projects p ON p.id = d.project_id
      ORDER BY d.created_at DESC
      LIMIT 20
    `,
    ]);

  const vehicles = vehicleRows as unknown as Array<{
    id: number;
    license_plate: string;
    vehicle_type: string;
    last_tuv: unknown;
    tire_type: string;
  }>;
  const tuvDueVehicles = vehicles.filter((v) => {
    const lastTuv = v.last_tuv instanceof Date ? v.last_tuv : new Date(String(v.last_tuv));
    return isTuvDueSoon(getNextTuvDue(lastTuv), now);
  });
  const seasonVehicles = vehicles.filter((v) => v.tire_type === "saison");

  const assignments = todaysAssignments as unknown as Array<{
    id: number;
    user_name: string;
    project_id: number;
    project_title: string;
    start_time: unknown;
    end_time: unknown;
    note: string | null;
  }>;

  const active = clockedIn as unknown as Array<{
    id: number;
    user_name: string;
    project_id: number | null;
    project_title: string | null;
    started_at: unknown;
  }>;

  const activity: ActivityEvent[] = [
    ...(
      recentTime as unknown as Array<{
        id: number;
        started_at: unknown;
        user_name: string;
        project_id: number | null;
        project_title: string | null;
      }>
    ).map((e) => ({
      key: `time-${e.id}`,
      timestamp: e.started_at,
      content: (
        <>
          <TypeBadge>Zeit</TypeBadge>
          <span className="text-silver-light">{e.user_name}</span>{" "}
          <span className="text-silver">
            hat Zeit erfasst –{" "}
            {e.project_id ? (
              <Link href={`/admin/auftraege/${e.project_id}`} className="hover:text-copper-light">
                {e.project_title}
              </Link>
            ) : (
              "Allgemein"
            )}{" "}
            · {toDateTimeLabel(e.started_at)}
          </span>
        </>
      ),
    })),
    ...(
      recentService as unknown as Array<{
        id: number;
        description: string;
        created_at: unknown;
        user_name: string;
        project_id: number;
        project_title: string;
      }>
    ).map((e) => ({
      key: `service-${e.id}`,
      timestamp: e.created_at,
      content: (
        <>
          <TypeBadge>Arbeit</TypeBadge>
          <span className="text-silver-light">{e.user_name}</span>{" "}
          <span className="text-silver">
            – {e.description} ·{" "}
            <Link href={`/admin/auftraege/${e.project_id}`} className="hover:text-copper-light">
              {e.project_title}
            </Link>{" "}
            · {toDateTimeLabel(e.created_at)}
          </span>
        </>
      ),
    })),
    ...(
      recentMaterial as unknown as Array<{
        id: number;
        description: string;
        created_at: unknown;
        user_name: string;
        project_id: number;
        project_title: string;
      }>
    ).map((e) => ({
      key: `material-${e.id}`,
      timestamp: e.created_at,
      content: (
        <>
          <TypeBadge>Material</TypeBadge>
          <span className="text-silver-light">{e.user_name}</span>{" "}
          <span className="text-silver">
            – {e.description} ·{" "}
            <Link href={`/admin/auftraege/${e.project_id}`} className="hover:text-copper-light">
              {e.project_title}
            </Link>{" "}
            · {toDateTimeLabel(e.created_at)}
          </span>
        </>
      ),
    })),
    ...(
      recentDocs as unknown as Array<{
        id: number;
        type: "photo" | "note" | "measurement";
        created_at: unknown;
        user_name: string;
        project_id: number;
        project_title: string;
      }>
    ).map((e) => ({
      key: `doc-${e.id}`,
      timestamp: e.created_at,
      content: (
        <>
          <TypeBadge>{e.type === "photo" ? "Foto" : "Notiz"}</TypeBadge>
          <span className="text-silver-light">{e.user_name}</span>{" "}
          <span className="text-silver">
            hat {e.type === "photo" ? "ein Foto hochgeladen" : "eine Notiz hinzugefügt"} –{" "}
            <Link href={`/admin/auftraege/${e.project_id}`} className="hover:text-copper-light">
              {e.project_title}
            </Link>{" "}
            · {toDateTimeLabel(e.created_at)}
          </span>
        </>
      ),
    })),
  ]
    .sort((a, b) => toTimestamp(b.timestamp) - toTimestamp(a.timestamp))
    .slice(0, 15);

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="text-xl font-semibold text-silver-light">Cockpit</h1>
      <p className="mb-6 text-sm text-silver">
        {today}
        {weather && (
          <>
            {" "}
            · Nordwalde: {Math.round(weather.temperatureC)}°C, {weather.description}
          </>
        )}
      </p>

      <div className="mb-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded border border-border p-4">
          <p className="text-xs text-silver">Umsatzsteuer-Voranmeldung (nächste Frist)</p>
          <p className="text-lg font-semibold text-silver-light">{formatDate(ustVaDeadline)}</p>
          <p className="mt-1 text-xs text-silver">
            Quartalsweise, jeweils am 10. des Folgemonats nach Quartalsende.
          </p>
        </div>
        <div className="rounded border border-border p-4">
          <p className="text-xs text-silver">Lohnzahlung (dieser Monat)</p>
          <p className="text-lg font-semibold text-silver-light">{formatDate(wageDueDate)}</p>
          <p className="mt-1 text-xs text-silver">Fällig am letzten Arbeitstag im Monat.</p>
        </div>
      </div>

      {(tuvDueVehicles.length > 0 || (tireChangeReminder && seasonVehicles.length > 0)) && (
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Fuhrpark</h2>
          <ul className="flex flex-col gap-2">
            {tuvDueVehicles.map((v) => {
              const lastTuv = v.last_tuv instanceof Date ? v.last_tuv : new Date(String(v.last_tuv));
              const due = getNextTuvDue(lastTuv);
              const overdue = isTuvOverdue(due, now);
              return (
                <li
                  key={`tuv-${v.id}`}
                  className={`rounded border px-4 py-2 text-sm ${
                    overdue ? "border-danger/40 bg-danger/10" : "border-copper/40 bg-card"
                  }`}
                >
                  <Link
                    href={`/admin/fuhrpark/${v.id}`}
                    className={overdue ? "font-medium text-danger" : "font-medium text-copper-light"}
                  >
                    {v.license_plate}
                  </Link>{" "}
                  <span className="text-silver">
                    ({v.vehicle_type}) · TÜV {overdue ? "überfällig seit" : "fällig am"}{" "}
                    {formatDate(due)}
                  </span>
                </li>
              );
            })}
            {tireChangeReminder &&
              seasonVehicles.map((v) => (
                <li
                  key={`tire-${v.id}`}
                  className="rounded border border-copper/40 bg-card px-4 py-2 text-sm"
                >
                  <Link href={`/admin/fuhrpark/${v.id}`} className="font-medium text-copper-light">
                    {v.license_plate}
                  </Link>{" "}
                  <span className="text-silver">
                    ({v.vehicle_type}) · Reifenwechsel auf{" "}
                    {tireChangeReminder === "sommer" ? "Sommerreifen" : "Winterreifen"} fällig
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mb-10 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Heute im Einsatz</h2>
          {assignments.length === 0 ? (
            <p className="text-sm text-silver">Für heute ist niemand eingeteilt.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignments.map((a) => (
                <li key={a.id} className="rounded border border-border bg-card px-4 py-2 text-sm">
                  <span className="font-medium text-silver-light">{a.user_name}</span>{" "}
                  <span className="text-silver">
                    –{" "}
                    <Link href={`/admin/auftraege/${a.project_id}`} className="hover:text-copper-light">
                      {a.project_title}
                    </Link>
                    {Boolean(a.start_time) && ` · ${toTimeLabel(a.start_time)}`}
                    {Boolean(a.end_time) && `–${toTimeLabel(a.end_time)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Aktuell eingestempelt</h2>
          {active.length === 0 ? (
            <p className="text-sm text-silver">Niemand ist gerade eingestempelt.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {active.map((entry) => (
                <li key={entry.id} className="rounded border border-border bg-card px-4 py-2 text-sm">
                  <span className="font-medium text-silver-light">{entry.user_name}</span>{" "}
                  <span className="text-silver">
                    –{" "}
                    {entry.project_id ? (
                      <Link
                        href={`/admin/auftraege/${entry.project_id}`}
                        className="hover:text-copper-light"
                      >
                        {entry.project_title}
                      </Link>
                    ) : (
                      "Allgemein"
                    )}{" "}
                    · seit {toTimeSinceLabel(entry.started_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Letzte Aktivitäten</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Aktivitäten erfasst.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {activity.map((event) => (
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
