import { sql } from "@/lib/db";

export async function getCompanyLogoUrl(): Promise<string | null> {
  try {
    const rows = (await sql`
      SELECT logo_blob_url FROM company_settings WHERE id = 1
    `) as unknown as Array<{ logo_blob_url: string | null }>;
    return rows[0]?.logo_blob_url ?? null;
  } catch {
    return null;
  }
}
