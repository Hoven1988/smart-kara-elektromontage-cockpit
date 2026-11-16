import Link from "next/link";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { clockIn, clockOut } from "@/actions/time";
import { fetchNordwaldeWeather } from "@/lib/weather";
import {
  getNextUstVaDeadline,
  getWageDueDate,
  getNextTuvDue,
  isTuvDueSoon,
  isTuvOverdue,
  getTireChangeReminder,
  isMonday,
  daysBetween,
} from "@/lib/deadlines";
import { setDeadlineDone } from "@/actions/deadlines";
import { setCalendarEntryDone } from "@/actions/calendar";
import { DeadlineCheckbox } from "@/components/deadline-checkbox";
import { closeExpiredTimeEntries } from "@/lib/worktime";

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
  const user = await getCurrentUser();
  if (!user) return null;

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
  const showWeekPreview = isMonday(now);
  const weekFrom = now.toISOString().slice(0, 10);
  const weekToDate = new Date(now);
  weekToDate.setDate(weekToDate.getDate() + 6);
  const weekTo = weekToDate.toISOString().slice(0, 10);

  // Nacheinander statt parallel: zu viele gleichzeitige Verbindungen lassen
  // den Supabase-Pooler hängen (siehe /api/backup - 13 parallele Queries
  // kamen nie zurück, nacheinander funktioniert zuverlässig). Das Wetter
  // hat zusätzlich einen eigenen Timeout (lib/weather.ts).
  const weather = await fetchNordwaldeWeather();
  await closeExpiredTimeEntries();
  const vehicleRows = await sql`SELECT id, license_plate, vehicle_type, last_tuv, tire_type FROM vehicles ORDER BY license_plate ASC`;
  const upcomingCalendarRows = showWeekPreview
    ? await sql`SELECT id, date, title, note FROM calendar_entries WHERE done = false AND date >= ${weekFrom} AND date <= ${weekTo} ORDER BY date ASC`
    : [];
  const nextCalendarEntryRows = await sql`SELECT id, date, title, note FROM calendar_entries WHERE done = false AND date >= CURRENT_DATE ORDER BY date ASC LIMIT 5`;
  const completedDeadlineRows = await sql`SELECT type, due_date FROM completed_deadlines WHERE type IN ('lohn', 'ust')`;
  const todaysAssignments = await sql`
      SELECT a.id, u.name AS user_name, p.id AS project_id, p.title AS project_title,
             a.start_time, a.end_time, a.note
      FROM assignments a
      JOIN users u ON u.id = a.user_id
      JOIN projects p ON p.id = a.project_id
      WHERE a.date = CURRENT_DATE
      ORDER BY a.start_time ASC NULLS LAST, u.name ASC
    `;
  const clockedIn = await sql`
      SELECT t.id, t.user_id, u.name AS user_name, p.id AS project_id, p.title AS project_title, t.started_at,
             c.name AS customer_name
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN projects p ON p.id = t.project_id
      LEFT JOIN customers c ON c.id = t.customer_id
      WHERE t.ended_at IS NULL
      ORDER BY t.started_at ASC
    `;
  const customerRows = await sql`SELECT id, name FROM customers ORDER BY name ASC`;
  const recentTime = await sql`
      SELECT t.id, t.started_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM time_entries t
      JOIN users u ON u.id = t.user_id
      LEFT JOIN projects p ON p.id = t.project_id
      ORDER BY t.started_at DESC
      LIMIT 20
    `;
  const recentService = await sql`
      SELECT s.id, s.description, s.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM service_entries s
      JOIN users u ON u.id = s.user_id
      JOIN projects p ON p.id = s.project_id
      ORDER BY s.created_at DESC
      LIMIT 20
    `;
  const recentMaterial = await sql`
      SELECT m.id, m.description, m.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM material_entries m
      JOIN users u ON u.id = m.user_id
      JOIN projects p ON p.id = m.project_id
      ORDER BY m.created_at DESC
      LIMIT 20
    `;
  const recentDocs = await sql`
      SELECT d.id, d.type, d.created_at, u.name AS user_name, p.id AS project_id, p.title AS project_title
      FROM doc_entries d
      JOIN users u ON u.id = d.user_id
      JOIN projects p ON p.id = d.project_id
      ORDER BY d.created_at DESC
      LIMIT 20
    `;

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

  const upcomingCalendarEntries = upcomingCalendarRows as unknown as Array<{
    id: number;
    date: unknown;
    title: string;
    note: string | null;
  }>;
  const upcomingTermine = nextCalendarEntryRows as unknown as Array<{
    id: number;
    date: unknown;
    title: string;
    note: string | null;
  }>;
  const nextTermin = upcomingTermine[0];
  const followingTermine = upcomingTermine.slice(1);

  const completedDeadlines = completedDeadlineRows as unknown as Array<{
    type: "lohn" | "ust";
    due_date: unknown;
  }>;
  function toDateStr(value: unknown): string {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return String(value).slice(0, 10);
  }
  const isDeadlineDone = (type: "lohn" | "ust", date: Date) =>
    completedDeadlines.some((c) => c.type === type && toDateStr(c.due_date) === toDateStr(date));
  const wageDueDateStr = toDateStr(wageDueDate);
  const ustVaDeadlineStr = toDateStr(ustVaDeadline);
  const lohnDone = isDeadlineDone("lohn", wageDueDate);
  const ustDone = isDeadlineDone("ust", ustVaDeadline);

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
    user_id: number;
    user_name: string;
    project_id: number | null;
    project_title: string | null;
    started_at: unknown;
    customer_name: string | null;
  }>;
  const myOpenEntry = active.find((entry) => entry.user_id === user.userId) ?? null;
  const customers = customerRows as unknown as Array<{ id: number; name: string }>;

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

      <div className="mb-10 max-w-sm">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Meine Arbeitszeit</h2>
        {myOpenEntry ? (
          <form action={clockOut.bind(null, myOpenEntry.project_id)} className="flex flex-col gap-3">
            <p className="text-sm text-silver">
              Eingestempelt seit {toDateTimeLabel(myOpenEntry.started_at)}
              {" · "}
              {myOpenEntry.project_id
                ? myOpenEntry.project_title
                : myOpenEntry.customer_name ?? "Allgemein"}
            </p>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="admin-clockout-note">
                Notiz
              </label>
              <input
                id="admin-clockout-note"
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
            <p className="text-xs text-silver">Pause wird automatisch nach Arbeitszeitgesetz abgezogen.</p>
          </form>
        ) : (
          <form action={clockIn.bind(null, null)} className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="admin-clockin-customer">
                Kunde
              </label>
              <select
                id="admin-clockin-customer"
                name="customer_id"
                defaultValue=""
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              >
                <option value="">– Auswählen (optional) –</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="admin-clockin-note">
                Baustelle
              </label>
              <input
                id="admin-clockin-note"
                name="note"
                placeholder="z.B. Münster, Musterstraße 1"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-silver" htmlFor="admin-clockin-km">
                Gefahrene km
              </label>
              <input
                id="admin-clockin-km"
                name="km_driven"
                type="number"
                min={0}
                step="0.1"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
            >
              Einstempeln
            </button>
          </form>
        )}
      </div>

      {(() => {
        const nextTerminDate = nextTermin
          ? nextTermin.date instanceof Date
            ? nextTermin.date
            : new Date(String(nextTermin.date))
          : null;

        const deadlineItems = [
          ...(lohnDone
            ? []
            : [
                {
                  key: "lohn" as const,
                  date: wageDueDate,
                  label: "Lohnzahlung (dieser Monat)",
                  detail: "Fällig am letzten Arbeitstag im Monat.",
                  onToggle: setDeadlineDone.bind(null, "lohn", wageDueDateStr),
                },
              ]),
          ...(nextTermin && nextTerminDate
            ? [
                {
                  key: "steuer" as const,
                  date: nextTerminDate,
                  label: "Steuervorauszahlung",
                  detail: `${nextTermin.title}${nextTermin.note ? ` · ${nextTermin.note}` : ""}`,
                  onToggle: setCalendarEntryDone.bind(null, nextTermin.id),
                },
              ]
            : []),
          ...(ustDone
            ? []
            : [
                {
                  key: "ust" as const,
                  date: ustVaDeadline,
                  label: "Umsatzsteuer-Voranmeldung (nächste Frist)",
                  detail: "Quartalsweise, jeweils am 10. des Folgemonats nach Quartalsende.",
                  onToggle: setDeadlineDone.bind(null, "ust", ustVaDeadlineStr),
                },
              ]),
        ].sort((a, b) => a.date.getTime() - b.date.getTime());

        if (deadlineItems.length === 0) return null;
        const [primary, ...secondary] = deadlineItems;

        return (
          <div className="mb-10 max-w-3xl">
            <div className="rounded border border-copper/40 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-silver">{primary.label}</p>
                  <p className="text-2xl font-semibold text-silver-light">{formatDate(primary.date)}</p>
                  <p className="mt-1 text-sm text-silver">{primary.detail}</p>
                </div>
                <DeadlineCheckbox checked={false} onToggle={primary.onToggle} />
              </div>

              {primary.key === "steuer" &&
                followingTermine.length > 0 &&
                daysBetween(now, primary.date) <= 5 && (
                  <ul className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                    {followingTermine.map((entry) => (
                      <li key={entry.id} className="text-xs text-silver">
                        {formatDate(
                          entry.date instanceof Date ? entry.date : new Date(String(entry.date))
                        )}{" "}
                        – {entry.title}
                        {entry.note ? ` · ${entry.note}` : ""}
                      </li>
                    ))}
                  </ul>
                )}
            </div>

            {secondary.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2">
                {secondary.map((item) => (
                  <li key={item.key} className="flex items-center justify-between gap-3 text-sm text-silver">
                    <span>
                      · {formatDate(item.date)} – {item.label}
                    </span>
                    <DeadlineCheckbox checked={false} onToggle={item.onToggle} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })()}

      {showWeekPreview && upcomingCalendarEntries.length > 0 && (
        <div className="mb-10 max-w-2xl">
          <h2 className="mb-3 text-lg font-semibold text-silver-light">Diese Woche</h2>
          <ul className="flex flex-col gap-2">
            {upcomingCalendarEntries.map((entry) => (
              <li key={`cal-${entry.id}`} className="rounded border border-copper/40 bg-card px-4 py-2 text-sm">
                <Link href="/admin/kalender" className="font-medium text-copper-light">
                  {formatDate(entry.date instanceof Date ? entry.date : new Date(String(entry.date)))}
                </Link>{" "}
                <span className="text-silver">
                  – {entry.title}
                  {entry.note ? ` · ${entry.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                      entry.customer_name ?? "Allgemein"
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
