import { createVehicle } from "@/actions/vehicles";

export default function NewVehiclePage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Neues Fahrzeug</h1>
      <form action={createVehicle} className="flex max-w-lg flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm text-silver" htmlFor="license_plate">
            Kennzeichen
          </label>
          <input
            id="license_plate"
            name="license_plate"
            required
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
            placeholder="z.B. VW Transporter T6"
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
            defaultValue="ganzjahr"
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
            className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Fahrzeug anlegen
        </button>
      </form>
    </div>
  );
}
