export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Einstellungen</h1>

      <div className="max-w-lg rounded border border-border p-4">
        <h2 className="mb-1 text-sm font-medium text-silver-light">Datensicherung</h2>
        <p className="mb-3 text-sm text-silver">
          Lädt alle Kunden-, Auftrags-, Zeiten- und sonstigen Daten als JSON-Datei herunter
          (ohne Passwörter).
        </p>
        <a
          href="/api/backup"
          className="inline-block rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
        >
          Datensicherung herunterladen
        </a>
      </div>
    </div>
  );
}
