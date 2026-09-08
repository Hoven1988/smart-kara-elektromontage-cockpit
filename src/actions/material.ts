"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireString, optionalString, optionalNumber } from "@/lib/validation";

export async function createMaterialEntry(projectId: number, formData: FormData) {
  const user = await requireUser();

  const description = requireString(formData.get("description"), "Beschreibung");
  const quantity = optionalNumber(formData.get("quantity"));
  const unit = optionalString(formData.get("unit"));
  const note = optionalString(formData.get("note"));

  await sql`
    INSERT INTO material_entries (project_id, user_id, description, quantity, unit, note)
    VALUES (${projectId}, ${user.userId}, ${description}, ${quantity}, ${unit}, ${note})
  `;

  const returnTo = optionalString(formData.get("_redirect")) ?? `/auftrag/${projectId}`;
  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
  redirect(`${returnTo}?saved=1`);
}
