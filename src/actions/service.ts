"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function createServiceEntry(projectId: number, formData: FormData) {
  const user = await requireUser();

  const description = requireString(formData.get("description"), "Beschreibung");
  const note = optionalString(formData.get("note"));

  await sql`
    INSERT INTO service_entries (project_id, user_id, description, note)
    VALUES (${projectId}, ${user.userId}, ${description}, ${note})
  `;

  const returnTo = optionalString(formData.get("_redirect")) ?? `/auftrag/${projectId}`;
  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
  redirect(`${returnTo}?saved=1`);
}

export async function deleteServiceEntry(id: number, projectId: number, redirectTo: string) {
  await requireAdmin();
  await sql`DELETE FROM service_entries WHERE id = ${id}`;
  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
  redirect(`${redirectTo}?saved=1`);
}
