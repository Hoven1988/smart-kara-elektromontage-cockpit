"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put, del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getCompanyLogoUrl } from "@/lib/settings";

export async function uploadCompanyLogo(formData: FormData) {
  await requireAdmin();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Bitte eine Bilddatei auswählen.");
  }

  const previousUrl = await getCompanyLogoUrl();

  const blob = await put(`company-logo-${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  await sql`
    INSERT INTO company_settings (id, logo_blob_url, updated_at)
    VALUES (1, ${blob.url}, now())
    ON CONFLICT (id) DO UPDATE SET logo_blob_url = ${blob.url}, updated_at = now()
  `;

  if (previousUrl) {
    await del(previousUrl).catch(() => {});
  }

  revalidatePath("/login");
  revalidatePath("/admin/einstellungen");
  redirect("/admin/einstellungen?saved=1");
}

export async function removeCompanyLogo() {
  await requireAdmin();

  const previousUrl = await getCompanyLogoUrl();
  await sql`UPDATE company_settings SET logo_blob_url = NULL, updated_at = now() WHERE id = 1`;

  if (previousUrl) {
    await del(previousUrl).catch(() => {});
  }

  revalidatePath("/login");
  revalidatePath("/admin/einstellungen");
}
