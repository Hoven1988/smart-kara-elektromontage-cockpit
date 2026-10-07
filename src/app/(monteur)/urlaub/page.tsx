import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { requestLeave, cancelLeaveRequest } from "@/actions/leave";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

function toDateLabel(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Wartet auf Freigabe",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
};

export default async function MyLeavePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [userRows, usedRows, requestRows] = await Promise.all([
    sql`SELECT vacation_days_per_year FROM users WHERE id = ${user.userId}`,
    sql`
      SELECT COALESCE(SUM(days), 0) AS used
      FROM leave_requests
      WHERE user_id = ${user.userId} AND status = 'approved'
        AND EXTRACT(YEAR FROM start_date) = EXTRACT(YEAR FROM CURRENT_DATE)
    `,
    sql`
      SELECT id, start_date, end_date, days, note, status, created_at
      FROM leave_requests
      WHERE user_id = ${user.userId}
      ORDER BY start_date DESC
    `,
  ]);

  const vacationDaysPerYear = Number(
    (userRows as unknown as Array<{ vacation_days_per_year: number }>)[0]?.vacation_days_per_year ?? 0
  );
  const usedDays = Number((usedRows as unknown as Array<{ used: string }>)[0]?.used ?? 0);
  const remainingDays = vacationDaysPerYear - usedDays;

  const requests = requestRows as unknown as Array<{
    id: number;
    start_date: unknown;
    end_date: unknown;
    days: number;
    note: string | null;
    status: "pending" | "approved" | "rejected";
    created_at: unknown;
  }>;

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-2 text-xl font-semibold text-silver-light">Urlaub</h1>
      <p className="mb-8 text-sm text-silver">
        {usedDays} von {vacationDaysPerYear} Tagen genommen (dieses Jahr) ·{" "}
        <span className="text-silver-light">{remainingDays} Tage Resturlaub</span>
      </p>

      <div className="mb-10 max-w-md">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Urlaub beantragen</h2>
        <form action={requestLeave} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="start_date">
                Von
              </label>
              <input
                id="start_date"
                name="start_date"
                type="date"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="end_date">
                Bis
              </label>
              <input
                id="end_date"
                name="end_date"
                type="date"
                required
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="note">
              Notiz (optional)
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
            Beantragen
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Meine Anträge</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-silver">Noch keine Urlaubsanträge gestellt.</p>
        ) : (
          <ul className="flex max-w-2xl flex-col gap-2">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex items-start justify-between gap-3 rounded border border-border px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-silver-light">
                    {toDateLabel(req.start_date)} – {toDateLabel(req.end_date)} ({req.days} Tage)
                  </p>
                  {req.note && <p className="text-silver">{req.note}</p>}
                  <p
                    className={`mt-1 text-xs ${
                      req.status === "rejected"
                        ? "text-danger"
                        : req.status === "approved"
                          ? "text-copper-light"
                          : "text-silver"
                    }`}
                  >
                    {STATUS_LABELS[req.status]}
                  </p>
                </div>
                {req.status === "pending" && (
                  <form action={cancelLeaveRequest.bind(null, req.id)}>
                    <ConfirmSubmitButton
                      confirmMessage="Diesen Antrag wirklich zurückziehen?"
                      className="shrink-0 text-xs text-silver hover:text-danger"
                    >
                      Zurückziehen
                    </ConfirmSubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
