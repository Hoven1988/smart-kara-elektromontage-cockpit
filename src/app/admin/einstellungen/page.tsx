import Image from "next/image";
import { getCompanyLogoUrl } from "@/lib/settings";
import { uploadCompanyLogo, removeCompanyLogo } from "@/actions/settings";

export default async function SettingsPage() {
  const logoUrl = await getCompanyLogoUrl();

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <h1 className="mb-6 text-xl font-semibold text-silver-light">Einstellungen</h1>

      <div className="max-w-md">
        <h2 className="mb-3 text-lg font-semibold text-silver-light">Eigenes Logo</h2>
        <p className="mb-4 text-sm text-silver">
          Optional: euer Firmenlogo, wird auf der Login-Seite angezeigt. Ohne
          eigenes Logo erscheint dort nur der Cockpit-Name.
        </p>

        {logoUrl && (
          <div className="mb-4 rounded border border-border bg-card p-4">
            <Image
              src={logoUrl}
              alt="Aktuelles Logo"
              width={240}
              height={80}
              className="h-auto max-h-20 w-auto"
            />
          </div>
        )}

        <form action={uploadCompanyLogo} className="flex flex-col gap-3">
          <input
            type="file"
            name="logo"
            accept="image/*"
            required
            className="text-sm text-silver file:mr-3 file:rounded file:border-0 file:bg-copper file:px-3 file:py-2 file:text-sm file:font-medium file:text-background hover:file:bg-copper-light"
          />
          <button
            type="submit"
            className="self-start rounded bg-copper px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-copper-light"
          >
            Logo hochladen
          </button>
        </form>

        {logoUrl && (
          <form action={removeCompanyLogo} className="mt-3">
            <button type="submit" className="text-xs text-silver hover:text-danger">
              Logo entfernen
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
