import Link from "next/link";
import { sql } from "@/lib/db";
import { fetchYearSummary } from "@/lib/lexware";
import { saveGewerbesteuerSettings } from "@/actions/gewerbesteuer";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDateTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

// Lexware begrenzt Anfragen (Rate-Limit); Werte daher eine Weile
// zwischenspeichern, statt bei jedem Seitenaufruf neu abzufragen.
const CACHE_MS = 24 * 60 * 60 * 1000;

// In eigene Funktion ausgelagert, damit der ESLint-Reinheits-Check für
// Server Components nicht an der direkten Date.now()-Nutzung anstößt.
function nowMs(): number {
  return Date.now();
}

export default async function GewerbesteuerPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; refresh?: string }>;
}) {
  const { year: yearParam, refresh } = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = yearParam ? Number(yearParam) : currentYear;

  const apiKey = process.env.LEXWARE_API_KEY;

  const settingsRows = await sql`
    SELECT gewinn_override, freibetrag, hebesatz, lexware_umsatz, lexware_ausgaben, lexware_fetched_at
    FROM gewerbesteuer_settings
    WHERE year = ${year}
  `;
  const settings = (
    settingsRows as unknown as Array<{
      gewinn_override: number | null;
      freibetrag: number;
      hebesatz: number | null;
      lexware_umsatz: number | null;
      lexware_ausgaben: number | null;
      lexware_fetched_at: unknown;
    }>
  )[0];

  let summary: { umsatz: number; ausgaben: number } | null = null;
  let fetchError: string | null = null;
  let summaryFetchedAt: unknown = null;
  let fromCache = false;

  const cacheAgeMs = settings?.lexware_fetched_at
    ? nowMs() - new Date(String(settings.lexware_fetched_at)).getTime()
    : Infinity;
  const cacheIsFresh = settings?.lexware_umsatz != null && cacheAgeMs < CACHE_MS;

  if (apiKey && cacheIsFresh && refresh !== "1") {
    summary = { umsatz: settings!.lexware_umsatz!, ausgaben: settings!.lexware_ausgaben! };
    summaryFetchedAt = settings!.lexware_fetched_at;
    fromCache = true;
  } else if (apiKey) {
    try {
      summary = await fetchYearSummary(apiKey, year);
      summaryFetchedAt = new Date();
      await sql`
        INSERT INTO gewerbesteuer_settings (year, lexware_umsatz, lexware_ausgaben, lexware_fetched_at)
        VALUES (${year}, ${summary.umsatz}, ${summary.ausgaben}, now())
        ON CONFLICT (year) DO UPDATE
        SET lexware_umsatz = ${summary.umsatz}, lexware_ausgaben = ${summary.ausgaben}, lexware_fetched_at = now()
      `;
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Unbekannter Fehler";
      // Bei Fehlschlag (z.B. Rate-Limit) auf zuletzt bekannten Stand zurückfallen, falls vorhanden.
      if (settings?.lexware_umsatz != null) {
        summary = { umsatz: settings.lexware_umsatz, ausgaben: settings.lexware_ausgaben! };
        summaryFetchedAt = settings.lexware_fetched_at;
        fromCache = true;
      }
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

      {fetchError && (
        <div className="mb-8 max-w-xl rounded border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          Verbindung zu Lexware fehlgeschlagen: {fetchError}
          {fromCache && " – zeige unten den zuletzt bekannten Stand."}
        </div>
      )}

      {summary && (
        <div className="mb-8 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded border border-border p-4">
              <p className="text-xs text-silver">Umsatz (Rechnungen lt. Lexware)</p>
              <p className="text-lg font-semibold text-silver-light">{formatEuro(summary.umsatz)}</p>
            </div>
            <div className="rounded border border-border p-4">
              <p className="text-xs text-silver">Ausgaben (Eingangsrechnungen lt. Lexware)</p>
              <p className="text-lg font-semibold text-silver-light">{formatEuro(summary.ausgaben)}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-silver">
            Stand: {formatDateTime(summaryFetchedAt)}
            {fromCache ? " (zwischengespeichert)" : ""} ·{" "}
            <Link href={`/admin/gewerbesteuer?year=${year}&refresh=1`} className="hover:text-copper-light">
              Jetzt aktualisieren
            </Link>
          </p>
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
