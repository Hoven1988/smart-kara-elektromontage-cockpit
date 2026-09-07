"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { optionalString, requireString } from "@/lib/validation";

export async function clockIn(projectId: number) {
  const user = await requireUser();

  const openEntries = await sql`
    SELECT id FROM time_entries
    WHERE user_id = ${user.userId} AND ended_at IS NULL
  `;
  if ((openEntries as unknown as unknown[]).length > 0) {
    throw new Error("Du bist bereits eingestempelt.");
  }

  await sql`
    INSERT INTO time_entries (user_id, project_id, started_at)
    VALUES (${user.userId}, ${projectId}, now())
  `;

  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath("/");
  revalidatePath("/zeiten");
  redirect(`/auftrag/${projectId}?saved=1`);
}

export async function clockOut(projectId: number, formData: FormData) {
  const user = await requireUser();

  const breakMinutesRaw = optionalString(formData.get("break_minutes"));
  const breakMinutes = breakMinutesRaw ? Number(breakMinutesRaw) : 0;
  const note = optionalString(formData.get("note"));

  await sql`
    UPDATE time_entries
    SET ended_at = now(), break_minutes = ${Number.isFinite(breakMinutes) ? breakMinutes : 0}, note = ${note}
    WHERE user_id = ${user.userId} AND project_id = ${projectId} AND ended_at IS NULL
  `;

  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath("/");
  revalidatePath("/zeiten");
  redirect(`/auftrag/${projectId}?saved=1`);
}

export async function createTimeEntry(formData: FormData) {
  await requireAdmin();

  const userId = Number(requireString(formData.get("user_id"), "Mitarbeiter"));
  const projectId = Number(requireString(formData.get("project_id"), "Auftrag"));
  const date = requireString(formData.get("date"), "Datum");
  const startTime = requireString(formData.get("start_time"), "Von");
  const endTime = optionalString(formData.get("end_time"));
  const breakMinutesRaw = optionalString(formData.get("break_minutes"));
  const breakMinutes = breakMinutesRaw ? Number(breakMinutesRaw) : 0;
  const note = optionalString(formData.get("note"));

  if (!Number.isInteger(userId) || !Number.isInteger(projectId)) {
    throw new Error("Ungültiger Mitarbeiter oder Auftrag.");
  }

  const startedAt = new Date(`${date}T${startTime}`);
  const endedAt = endTime ? new Date(`${date}T${endTime}`) : null;

  await sql`
    INSERT INTO time_entries (user_id, project_id, started_at, ended_at, break_minutes, note, edited_by_admin)
    VALUES (${userId}, ${projectId}, ${startedAt}, ${endedAt}, ${Number.isFinite(breakMinutes) ? breakMinutes : 0}, ${note}, true)
  `;

  revalidatePath("/admin/zeiten");
  redirect("/admin/zeiten?saved=1");
}

export async function updateTimeEntry(id: number, formData: FormData) {
  await requireAdmin();

  const breakMinutesRaw = optionalString(formData.get("break_minutes"));
  const breakMinutes = breakMinutesRaw ? Number(breakMinutesRaw) : 0;
  const note = optionalString(formData.get("note"));
  const endedAtRaw = optionalString(formData.get("ended_at"));

  await sql`
    UPDATE time_entries
    SET break_minutes = ${Number.isFinite(breakMinutes) ? breakMinutes : 0},
        note = ${note},
        edited_by_admin = true
    WHERE id = ${id}
  `;

  if (endedAtRaw) {
    await sql`UPDATE time_entries SET ended_at = ${new Date(endedAtRaw)} WHERE id = ${id}`;
  }

  revalidatePath("/admin/zeiten");
  redirect("/admin/zeiten?saved=1");
}
