import Link from "next/link";
import { sql } from "@/lib/db";
import { isTuvDueSoon, isTuvOverdue } from "@/lib/deadlines";

function formatDate(value: unknown): string {
  if (!value) return "–";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

const TIRE_LABELS: Record<string, string> = {
  ganzjahr: "Ganzjahresreifen",
  saison: "Saisonreifen",
};

export default async function FuhrparkPage() {
  const rows = await sql`
    SELECT id, license_plate, vehicle_type, last_tuv, next_tuv_due, tire_type
    FROM vehicles
    ORDER BY license_plate ASC
  `;
  const vehicles = rows as unknown as Array<{
    id: number;
    license_plate: string;
    vehicle_type: string;
    last_tuv: unknown;
    next_tuv_due: unknown;
    tire_type: string;
  }>;

  const today = new Date();

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Fuhrpark</h1>
        <Link
          href="/admin/fuhrpark/neu"
          className="rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          + Fahrzeug hinzufügen
        </Link>
      </div>

      {vehicles.length === 0 ? (
        <p className="text-sm text-silver">Noch keine Fahrzeuge erfasst.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-silver">
              <tr>
                <th className="px-4 py-3 font-medium">Kennzeichen</th>
                <th className="px-4 py-3 font-medium">Fahrzeugtyp</th>
                <th className="px-4 py-3 font-medium">Letzter TÜV</th>
                <th className="px-4 py-3 font-medium">Nächster TÜV</th>
                <th className="px-4 py-3 font-medium">Reifen</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const nextTuv = vehicle.next_tuv_due
                  ? vehicle.next_tuv_due instanceof Date
                    ? vehicle.next_tuv_due
                    : new Date(String(vehicle.next_tuv_due))
                  : null;
                const dueSoon = nextTuv ? isTuvDueSoon(nextTuv, today) : false;
                const overdue = nextTuv ? isTuvOverdue(nextTuv, today) : false;

                return (
                  <tr key={vehicle.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/fuhrpark/${vehicle.id}`}
                        className="font-medium text-silver-light hover:text-copper-light"
                      >
                        {vehicle.license_plate}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-silver">{vehicle.vehicle_type}</td>
                    <td className="px-4 py-3 text-silver">{formatDate(vehicle.last_tuv)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          overdue
                            ? "font-medium text-danger"
                            : dueSoon
                              ? "font-medium text-copper-light"
                              : "text-silver"
                        }
                      >
                        {formatDate(vehicle.next_tuv_due)}
                        {overdue ? " (überfällig)" : dueSoon ? " (bald fällig)" : ""}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-silver">
                      {TIRE_LABELS[vehicle.tire_type] ?? vehicle.tire_type}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
