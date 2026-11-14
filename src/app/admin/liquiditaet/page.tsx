import Link from "next/link";
import { sql } from "@/lib/db";
import { fetchLiquiditySnapshot, type LiquiditySnapshot, type OpenInvoice } from "@/lib/lexware";

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

function formatDate(value: string | null): string {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("de-DE", { dateStyle: "medium" });
}

function formatDateTime(value: unknown): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(String(value));
  return date.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

// Lexware begrenzt Anfragen (Rate-Limit); Stand daher eine Weile
// zwischenspeichern statt bei jedem Seitenaufruf neu abzufragen.
const CACHE_MS = 24 * 60 * 60 * 1000;

function nowMs(): number {
  return Date.now();
}

function InvoiceTable({ invoices, emptyLabel }: { invoices: OpenInvoice[]; emptyLabel: string }) {
  if (invoices.length === 0) {
    return <p className="text-sm text-silver">{emptyLabel}</p>;
  }
  const total = invoices.reduce((sum, i) => sum + i.openAmount, 0);
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-silver">
          <tr>
            <th className="px-4 py-3 font-medium">Beleg</th>
            <th className="px-4 py-3 font-medium">Kontakt</th>
            <th className="px-4 py-3 font-medium">Fällig am</th>
            <th className="px-4 py-3 font-medium">Offener Betrag</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 text-silver-light">{inv.voucherNumber}</td>
              <td className="px-4 py-3 text-silver">{inv.contactName}</td>
              <td className="px-4 py-3 text-silver">{formatDate(inv.dueDate)}</td>
              <td className="px-4 py-3 text-silver-light">{formatEuro(inv.openAmount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="px-4 py-3 font-medium text-silver-light" colSpan={3}>
              Summe
            </td>
            <td className="px-4 py-3 font-semibold text-silver-light">{formatEuro(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default async function LiquiditaetPage({
  searchParams,
}: {
  searchParams: Promise<{ refresh?: string }>;
}) {
  const { refresh } = await searchParams;
  const apiKey = process.env.LEXWARE_API_KEY;

  const cacheRows = await sql`SELECT data, fetched_at FROM liquidity_cache WHERE id = 1`;
  const cacheRow = (cacheRows as unknown as Array<{ data: LiquiditySnapshot | null; fetched_at: unknown }>)[0];

  let snapshot: LiquiditySnapshot | null = null;
  let fetchError: string | null = null;
  let fetchedAt: unknown = null;
  let fromCache = false;

  const cacheAgeMs = cacheRow?.fetched_at ? nowMs() - new Date(String(cacheRow.fetched_at)).getTime() : Infinity;
  const cacheIsFresh = cacheRow?.data != null && cacheAgeMs < CACHE_MS;

  if (apiKey && cacheIsFresh && refresh !== "1") {
    snapshot = cacheRow!.data;
    fetchedAt = cacheRow!.fetched_at;
    fromCache = true;
  } else if (apiKey) {
    try {
      snapshot = await fetchLiquiditySnapshot(apiKey);
      fetchedAt = new Date();
      await sql`
        INSERT INTO liquidity_cache (id, data, fetched_at)
        VALUES (1, ${JSON.stringify(snapshot)}::jsonb, now())
        ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(snapshot)}::jsonb, fetched_at = now()
      `;
    } catch (err) {
      fetchError = err instanceof Error ? err.message : "Unbekannter Fehler";
      if (cacheRow?.data != null) {
        snapshot = cacheRow.data;
        fetchedAt = cacheRow.fetched_at;
        fromCache = true;
      }
    }
  }

  const sumOpen = (invoices: OpenInvoice[]) => invoices.reduce((sum, i) => sum + i.openAmount, 0);

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-2 text-xl font-semibold text-silver-light">Liquiditätsplanung</h1>
      <p className="mb-8 max-w-2xl rounded border border-copper/40 bg-card px-4 py-3 text-sm text-silver">
        Zeigt offene Rechnungen aus Lexware. <span className="text-silver-light">Keine vollständige
        Liquiditätsvorschau</span> – echte Bankabbuchungen, Daueraufträge oder nicht in Lexware
        erfasste Zahlungen sind hier nicht enthalten.
      </p>

      {!apiKey && (
        <div className="mb-8 max-w-xl rounded border border-border bg-card p-4 text-sm text-silver">
          <p className="mb-2 font-medium text-silver-light">Lexware-Verbindung noch nicht eingerichtet</p>
          <p>
            Trage auf Vercel unter Project Settings → Environment Variables einen Schlüssel{" "}
            <code>LEXWARE_API_KEY</code> ein. Den Schlüssel erzeugst du in Lexware Office unter
            Einstellungen → öffentliche API.
          </p>
        </div>
      )}

      {fetchError && (
        <div className="mb-8 max-w-2xl rounded border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          Verbindung zu Lexware fehlgeschlagen: {fetchError}
          {fromCache && " – zeige unten den zuletzt bekannten Stand."}
        </div>
      )}

      {snapshot && (
        <>
          <p className="mb-6 text-xs text-silver">
            Stand: {formatDateTime(fetchedAt)}
            {fromCache ? " (zwischengespeichert)" : ""} ·{" "}
            <Link href="/admin/liquiditaet?refresh=1" className="hover:text-copper-light">
              Jetzt aktualisieren
            </Link>
          </p>

          <div className="mb-10 max-w-3xl">
            <h2 className="mb-3 text-lg font-semibold text-silver-light">
              Offene Ausgangsrechnungen (erwarteter Zahlungseingang)
            </h2>
            <InvoiceTable
              invoices={snapshot.openSales}
              emptyLabel="Keine offenen Ausgangsrechnungen."
            />
          </div>

          <div className="mb-10 max-w-3xl">
            <h2 className="mb-3 text-lg font-semibold text-silver-light">
              Offene Eingangsrechnungen / Abbuchungen (noch zu zahlen)
            </h2>
            <InvoiceTable
              invoices={snapshot.openPurchases}
              emptyLabel="Keine offenen Eingangsrechnungen."
            />
          </div>

          <div className="max-w-md rounded border border-copper/40 bg-card p-4">
            <p className="text-sm text-silver">
              Erwarteter Eingang: {formatEuro(sumOpen(snapshot.openSales))}
            </p>
            <p className="text-sm text-silver">
              Noch zu zahlen: {formatEuro(sumOpen(snapshot.openPurchases))}
            </p>
            <p className="mt-1 text-lg font-semibold text-silver-light">
              Saldo: {formatEuro(sumOpen(snapshot.openSales) - sumOpen(snapshot.openPurchases))}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
