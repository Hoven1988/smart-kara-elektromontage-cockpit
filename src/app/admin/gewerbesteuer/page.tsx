import Link from "next/link";
import { sql } from "@/lib/db";
import { fetchYearSummary } from "@/lib/lexware";
import { saveGewerbesteuerSettings } from "@/actions/gewerbesteuer";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

export default async function GewerbesteuerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : currentYear;

  const apiKey = process.env.LEXWARE_API_KEY;

  const settingsRows = await sql`
    SELECT gewinn_override, freibetrag, hebesatz
    FROM gewerbesteuer_settings
    WHERE year = ${year}
  `;
  const settings = (
    settingsRows as unknown as Array<{
      gewinn_override: number | null;
      freibetrag: number;
      hebesatz: number | null;
    }>
  )[0];

  let summary: { umsatz: number; ausgaben: number } | null = null;
  let fetchError: string | null = null;
  if (apiKey) {
    try {
      summary = await fetchYearSummary(apiKey, year);
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Unbekannter Fehler";
    }
  }

  const freibetrag = settings?.freibetrag ?? 24500;
  const hebesatz = settings?.hebesatz ?? null;
  const estimatedGewinn = summary ? summary.umsatz - summary.ausgaben : null;
  const gewinn = settings?.gewinn_override ?? estimatedGewinn;

  let steuermessbetrag: number | null = null;
  let gewerbesteuer: number | null = null;
  if (gewinn !== null && hebesatz !== null) {
    const gewerbeertrag = Math.floor(gewinn / 100) * 100;
    const steuerpflichtig = Math.max(0, gewerbeertrag - freibetrag);
    steuermessbetrag = steuerpflichtig * 0.035;
    gewerbesteuer = steuermessbetrag * (hebesatz / 100);
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-silver-light">Gewerbesteuer</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/admin/gewerbesteuer?year=${year - 1}`}
            className="rounded border border-border px-3 py-1.5 text-silver-light hover:border-copper"
          >
            {year - 1}
          </Link>
          <span className="rounded bg-copper px-3 py-1.5 font-medium text-background">{year}</span>
          <Link
            href={`/admin/gewerbesteuer?year=${year + 1}`}
            className="rounded border border-border px-3 py-1.5 text-silver-light hover:border-copper"
          >
            {year + 1}
          </Link>
        </div>
      </div>

      <p className="mb-8 max-w-2xl rounded border border-copper/40 bg-card px-4 py-3 text-sm text-silver">
        Diese Seite liefert nur eine <span className="text-silver-light">grobe Schätzung</span>.
        Sie ersetzt nicht die Berechnung durch Steuerberater:in oder Finanzamt und berücksichtigt
        weder Abschreibungen noch Rückstellungen, Privatentnahmen oder andere Korrekturen des
        steuerlichen Gewinns.
      </p>

      {!apiKey && (
        <div className="mb-8 max-w-xl rounded border border-border bg-card p-4 text-sm text-silver">
          <p className="mb-2 font-medium text-silver-light">Lexware-Verbindung noch nicht eingerichtet</p>
          <p>
            Trage in den Umgebungsvariablen (lokal in <code>.env.local</code>, auf Vercel unter
            Project Settings → Environment Variables) einen Schlüssel{" "}
            <code>LEXWARE_API_KEY</code> ein. Den Schlüssel erzeugst du in Lexware Office unter
            Einstellungen → öffentliche API.
          </p>
        </div>
      )}

      {fetchError && (
        <div className="mb-8 max-w-xl rounded border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          Verbindung zu Lexware fehlgeschlagen: {fetchError}
        </div>
      )}

      {summary && (
        <div className="mb-8 grid max-w-xl grid-cols-2 gap-4">
          <div className="rounded border border-border p-4">
            <p className="text-xs text-silver">Umsatz (Rechnungen lt. Lexware)</p>
            <p className="text-lg font-semibold text-silver-light">{formatEuro(summary.umsatz)}</p>
          </div>
          <div className="rounded border border-border p-4">
            <p className="text-xs text-silver">Ausgaben (Eingangsrechnungen lt. Lexware)</p>
            <p className="text-lg font-semibold text-silver-light">{formatEuro(summary.ausgaben)}</p>
          </div>
        </div>
      )}

      <div className="mb-8 max-w-xl">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Angaben für {year}</h2>
        <form
          action={saveGewerbesteuerSettings.bind(null, year)}
          className="flex flex-col gap-4"
        >
          <div>
            <label className="mb-1 block text-sm text-silver" htmlFor="gewinn_override">
              Gewinn (steuerlich, z.B. aus Lexware-BWA oder vom Steuerberater)
            </label>
            <input
              id="gewinn_override"
              name="gewinn_override"
              type="number"
              step="0.01"
              defaultValue={gewinn ?? ""}
              placeholder={
                estimatedGewinn !== null
                  ? `Schätzung: ${estimatedGewinn.toFixed(2)}`
                  : "noch keine Lexware-Daten"
              }
              className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
            />
            {estimatedGewinn !== null && (
              <p className="mt-1 text-xs text-silver">
                Aus Lexware abgeleiteter Startwert (Umsatz − Ausgaben): {formatEuro(estimatedGewinn)}
                . Bitte durch den tatsächlichen steuerlichen Gewinn ersetzen, sobald bekannt.
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="freibetrag">
                Freibetrag (§11 Abs. 1 GewStG)
              </label>
              <input
                id="freibetrag"
                name="freibetrag"
                type="number"
                step="0.01"
                defaultValue={freibetrag}
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
              <p className="mt-1 text-xs text-silver">
                24.500 € für Einzelunternehmen/Personengesellschaften, 0 € für Kapitalgesellschaften.
              </p>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-silver" htmlFor="hebesatz">
                Hebesatz der Gemeinde (%)
              </label>
              <input
                id="hebesatz"
                name="hebesatz"
                type="number"
                step="0.01"
                defaultValue={hebesatz ?? ""}
                placeholder="z.B. 420"
                className="w-full rounded border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-copper"
              />
              <p className="mt-1 text-xs text-silver">Aktuellen Hebesatz bei der Gemeinde erfragen.</p>
            </div>
          </div>

          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Speichern
          </button>
        </form>
      </div>

      {gewerbesteuer !== null && steuermessbetrag !== null && (
        <div className="max-w-xl rounded border border-copper/40 bg-card p-4">
          <p className="text-sm text-silver">Steuermessbetrag: {formatEuro(steuermessbetrag)}</p>
          <p className="mt-1 text-lg font-semibold text-silver-light">
            Geschätzte Gewerbesteuer {year}: {formatEuro(gewerbesteuer)}
          </p>
        </div>
      )}
    </div>
  );
}
