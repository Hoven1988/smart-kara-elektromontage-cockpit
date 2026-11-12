"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { optionalString } from "@/lib/validation";

export async function saveGewerbesteuerSettings(year: number, formData: FormData) {
  await requireAdmin();

  const gewinnRaw = optionalString(formData.get("gewinn_override"));
  const freibetragRaw = optionalString(formData.get("freibetrag"));
  const hebesatzRaw = optionalString(formData.get("hebesatz"));

  const gewinn = gewinnRaw ? Number(gewinnRaw) : null;
  const freibetrag = freibetragRaw ? Number(freibetragRaw) : 24500;
  const hebesatz = hebesatzRaw ? Number(hebesatzRaw) : null;

  await sql`
    INSERT INTO gewerbesteuer_settings (year, gewinn_override, freibetrag, hebesatz, updated_at)
    VALUES (${year}, ${gewinn}, ${freibetrag}, ${hebesatz}, now())
    ON CONFLICT (year) DO UPDATE
    SET gewinn_override = ${gewinn}, freibetrag = ${freibetrag}, hebesatz = ${hebesatz}, updated_at = now()
  `;

  revalidatePath("/admin/gewerbesteuer");
  redirect(`/admin/gewerbesteuer?year=${year}&saved=1`);
}
