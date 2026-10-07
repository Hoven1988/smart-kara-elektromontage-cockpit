import { sql } from "@/lib/db";
import { reviewLeaveRequest } from "@/actions/leave";

function toDateLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

export default async function AdminLeavePage() {
  const [pendingRows, upcomingRows, balanceRows] = await Promise.all([
    sql`
      SELECT r.id, r.start_date, r.end_date, r.days, r.note, r.created_at, u.name AS user_name
      FROM leave_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.start_date ASC
    `,
    sql`
      SELECT r.id, r.start_date, r.end_date, r.days, u.name AS user_name
      FROM leave_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'approved' AND r.end_date >= CURRENT_DATE
      ORDER BY r.start_date ASC
    `,
    sql`
      SELECT u.id, u.name, u.vacation_days_per_year,
             COALESCE(SUM(r.days) FILTER (
               WHERE r.status = 'approved'
                 AND EXTRACT(YEAR FROM r.start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
             ), 0) AS used
      FROM users u
      LEFT JOIN leave_requests r ON r.user_id = u.id
      WHERE u.active = true
      GROUP BY u.id, u.name, u.vacation_days_per_year
      ORDER BY u.name ASC
    `,
  ]);

  const pending = pendingRows as unknown as Array<{
    id: number;
    start_date: unknown;
    end_date: unknown;
    days: number;
    note: string | null;
    user_name: string;
  }>;

  const upcoming = upcomingRows as unknown as Array<{
    id: number;
    start_date: unknown;
    end_date: unknown;
    days: number;
    user_name: string;
  }>;

  const balances = balanceRows as unknown as Array<{
    id: number;
    name: string;
    vacation_days_per_year: number;
    used: string;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Urlaub</h1>

      <div className="mb-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">
          Offene Anträge ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-silver">Keine offenen Urlaubsanträge.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {pending.map((req) => (
              <li key={req.id} className="rounded border border-copper/40 bg-card p-4 text-sm">
                <p className="mb-1 font-medium text-silver-light">
                  {req.user_name} · {toDateLabel(req.start_date)} – {toDateLabel(req.end_date)} (
                  {req.days} Tage)
                </p>
                {req.note && <p className="mb-3 text-silver">{req.note}</p>}
                <div className="flex gap-3">
                  <form action={reviewLeaveRequest.bind(null, req.id, "approved")}>
                    <button
                      type="submit"
                      className="rounded bg-copper px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-copper-light"
                    >
                      Genehmigen
                    </button>
                  </form>
                  <form action={reviewLeaveRequest.bind(null, req.id, "rejected")}>
                    <button
                      type="submit"
                      className="rounded border border-border px-3 py-1.5 text-xs text-silver transition-colors hover:border-danger hover:text-danger"
                    >
                      Ablehnen
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-10 max-w-2xl">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Anstehender Urlaub</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-silver">Kein genehmigter Urlaub in der Zukunft.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((req) => (
              <li key={req.id} className="rounded border border-border px-4 py-2 text-sm">
                <span className="font-medium text-silver-light">{req.user_name}</span>{" "}
                <span className="text-silver">
                  · {toDateLabel(req.start_date)} – {toDateLabel(req.end_date)} ({req.days} Tage)
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Resturlaub pro Mitarbeiter</h2>
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full max-w-2xl text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Mitarbeiter</th>
                <th className="px-4 py-3 font-medium">Anspruch</th>
                <th className="px-4 py-3 font-medium">Genommen</th>
                <th className="px-4 py-3 font-medium">Rest</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((b) => {
                const used = Number(b.used);
                return (
                  <tr key={b.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-silver-light">{b.name}</td>
                    <td className="px-4 py-3 text-silver">{b.vacation_days_per_year}</td>
                    <td className="px-4 py-3 text-silver">{used}</td>
                    <td className="px-4 py-3 text-silver-light">
                      {b.vacation_days_per_year - used}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
