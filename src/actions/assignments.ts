"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function createAssignment(formData: FormData) {
  const admin = await requireAdmin();

  const projectId = Number(requireString(formData.get("project_id"), "Auftrag"));
  const userId = Number(requireString(formData.get("user_id"), "Mitarbeiter"));
  const date = requireString(formData.get("date"), "Datum");
  const startTime = optionalString(formData.get("start_time"));
  const endTime = optionalString(formData.get("end_time"));
  const note = optionalString(formData.get("note"));

  if (!Number.isInteger(projectId) || !Number.isInteger(userId)) {
    throw new Error("Ungültiger Auftrag oder Mitarbeiter.");
  }

  await sql`
    INSERT INTO assignments (project_id, user_id, date, start_time, end_time, note, created_by)
    VALUES (${projectId}, ${userId}, ${date}, ${startTime}, ${endTime}, ${note}, ${admin.userId})
  `;

  revalidatePath("/admin/planung");
  redirect("/admin/planung?saved=1");
}

export async function deleteAssignment(id: number) {
  await requireAdmin();
  await sql`DELETE FROM assignments WHERE id = ${id}`;
  revalidatePath("/admin/planung");
}
