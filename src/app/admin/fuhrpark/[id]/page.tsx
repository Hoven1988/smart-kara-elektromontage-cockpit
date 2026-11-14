import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { updateVehicle, deleteVehicle } from "@/actions/vehicles";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

function toDateInputValue(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const rows = await sql`
    SELECT id, license_plate, vehicle_type, last_tuv, next_tuv_due, tire_type, note
    FROM vehicles
    WHERE id = ${id}
  `;
  const vehicle = (
    rows as unknown as Array<{
      id: number;
      license_plate: string;
      vehicle_type: string;
      last_tuv: unknown;
      next_tuv_due: unknown;
      tire_type: string;
      note: string | null;
    }>
  )[0];
  if (!vehicle) notFound();

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 py-6">
      <div>
        <h1 className="mb-6 text-xl font-semibold text-silver-light">{vehicle.license_plate}</h1>
        <form action={updateVehicle.bind(null, id)} className="flex max-w-lg flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="license_plate">
              Kennzeichen
            </label>
            <input
              id="license_plate"
              name="license_plate"
              required
              defaultValue={vehicle.license_plate}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="vehicle_type">
              Fahrzeugtyp
            </label>
            <input
              id="vehicle_type"
              name="vehicle_type"
              required
              defaultValue={vehicle.vehicle_type}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="last_tuv">
                Letzter TÜV
              </label>
              <input
                id="last_tuv"
                name="last_tuv"
                type="date"
                defaultValue={toDateInputValue(vehicle.last_tuv)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="next_tuv_due">
                Nächster TÜV fällig am
              </label>
              <input
                id="next_tuv_due"
                name="next_tuv_due"
                type="date"
                defaultValue={toDateInputValue(vehicle.next_tuv_due)}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="tire_type">
              Bereifung
            </label>
            <select
              id="tire_type"
              name="tire_type"
              defaultValue={vehicle.tire_type}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            >
              <option value="ganzjahr">Ganzjahresreifen</option>
              <option value="saison">Saisonreifen (Sommer/Winter)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="note">
              Notiz
            </label>
            <input
              id="note"
              name="note"
              defaultValue={vehicle.note ?? ""}
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
          </div>

          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Speichern
          </button>
        </form>
      </div>

      <div>
        <form action={deleteVehicle.bind(null, id)}>
          <ConfirmSubmitButton
            confirmMessage={`${vehicle.license_plate} wirklich löschen?`}
            className="rounded border border-border px-4 py-2 text-sm text-silver transition-colors hover:border-danger hover:text-danger"
          >
            Fahrzeug löschen
          </ConfirmSubmitButton>
        </form>
      </div>
    </div>
  );
}
