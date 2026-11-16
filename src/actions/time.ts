"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { optionalString, requireString } from "@/lib/validation";
import { autoBreakMinutes, closeExpiredTimeEntries } from "@/lib/worktime";

export async function clockIn(projectId: number | null, formData: FormData) {
  const user = await requireUser();
  await closeExpiredTimeEntries();

  const openEntries = await sql`
    SELECT id FROM time_entries
    WHERE user_id = ${user.userId} AND ended_at IS NULL
  `;
  if ((openEntries as unknown as unknown[]).length > 0) {
    throw new Error("Du bist bereits eingestempelt.");
  }

  const customerIdRaw = optionalString(formData.get("customer_id"));
  const customerId = customerIdRaw ? Number(customerIdRaw) : null;
  const note = optionalString(formData.get("note"));
  const kmRaw = optionalString(formData.get("km_driven"));
  const km = kmRaw ? Number(kmRaw) : null;

  await sql`
    INSERT INTO time_entries (user_id, project_id, customer_id, started_at, note, km_driven)
    VALUES (
      ${user.userId}, ${projectId}, ${customerId}, now(), ${note},
      ${km !== null && Number.isFinite(km) ? km : null}
    )
  `;

  const returnTo = projectId ? `/auftrag/${projectId}` : "/";
  if (projectId) revalidatePath(`/auftrag/${projectId}`);
  revalidatePath("/");
  revalidatePath("/zeiten");
  redirect(`${returnTo}?saved=1`);
}

export async function clockOut(projectId: number | null, formData: FormData) {
  const user = await requireUser();
  await closeExpiredTimeEntries();

  const note = optionalString(formData.get("note"));

  // Ein Monteur hat laut clockIn() immer höchstens einen offenen Eintrag,
  // daher reicht der Filter auf user_id + offen - unabhängig vom Projekt.
  const openRows = await sql`
    SELECT id, started_at FROM time_entries
    WHERE user_id = ${user.userId} AND ended_at IS NULL
  `;
  const open = (openRows as unknown as Array<{ id: number; started_at: unknown }>)[0];

  if (open) {
    const startedAt = open.started_at instanceof Date ? open.started_at : new Date(String(open.started_at));
    const grossMinutes = Math.round((Date.now() - startedAt.getTime()) / 60000);
    const breakMinutes = autoBreakMinutes(grossMinutes);

    await sql`
      UPDATE time_entries
      SET ended_at = now(), break_minutes = ${breakMinutes}, note = ${note}
      WHERE id = ${open.id}
    `;
  }

  const returnTo = projectId ? `/auftrag/${projectId}` : "/";
  if (projectId) revalidatePath(`/auftrag/${projectId}`);
  revalidatePath("/");
  revalidatePath("/zeiten");
  redirect(`${returnTo}?saved=1`);
}

export async function createOwnTimeEntry(formData: FormData) {
  const user = await requireUser();

  const projectIdRaw = optionalString(formData.get("project_id"));
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;
  const customerIdRaw = optionalString(formData.get("customer_id"));
  const customerId = customerIdRaw ? Number(customerIdRaw) : null;
  const date = requireString(formData.get("date"), "Datum");
  const startTime = requireString(formData.get("start_time"), "Von");
  const endTime = requireString(formData.get("end_time"), "Bis");
  const kmRaw = optionalString(formData.get("km_driven"));
  const km = kmRaw ? Number(kmRaw) : null;
  const note = optionalString(formData.get("note"));

  if (projectId !== null && !Number.isInteger(projectId)) {
    throw new Error("Ungültiger Auftrag.");
  }

  const startedAt = new Date(`${date}T${startTime}`);
  const endedAt = new Date(`${date}T${endTime}`);
  if (endedAt < startedAt) {
    throw new Error("Das Ende darf nicht vor dem Beginn liegen.");
  }
  const breakMinutes = autoBreakMinutes(Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

  await sql`
    INSERT INTO time_entries
      (user_id, project_id, customer_id, started_at, ended_at, break_minutes, note, km_driven, self_entered)
    VALUES (
      ${user.userId}, ${projectId}, ${customerId}, ${startedAt}, ${endedAt}, ${breakMinutes}, ${note},
      ${km !== null && Number.isFinite(km) ? km : null}, true
    )
  `;

  revalidatePath("/zeiten");
  revalidatePath("/admin/zeiten");
  redirect("/zeiten?saved=1");
}

export async function updateOwnTimeEntry(id: number, formData: FormData) {
  const user = await requireUser();

  const owned = await sql`
    SELECT id FROM time_entries WHERE id = ${id} AND user_id = ${user.userId} AND self_entered = true
  `;
  if ((owned as unknown as unknown[]).length === 0) {
    throw new Error("Dieser Eintrag kann nicht bearbeitet werden.");
  }

  const projectIdRaw = optionalString(formData.get("project_id"));
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;
  const customerIdRaw = optionalString(formData.get("customer_id"));
  const customerId = customerIdRaw ? Number(customerIdRaw) : null;
  const date = requireString(formData.get("date"), "Datum");
  const startTime = requireString(formData.get("start_time"), "Von");
  const endTime = requireString(formData.get("end_time"), "Bis");
  const kmRaw = optionalString(formData.get("km_driven"));
  const km = kmRaw ? Number(kmRaw) : null;
  const note = optionalString(formData.get("note"));

  if (projectId !== null && !Number.isInteger(projectId)) {
    throw new Error("Ungültiger Auftrag.");
  }

  const startedAt = new Date(`${date}T${startTime}`);
  const endedAt = new Date(`${date}T${endTime}`);
  if (endedAt < startedAt) {
    throw new Error("Das Ende darf nicht vor dem Beginn liegen.");
  }
  const breakMinutes = autoBreakMinutes(Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));

  await sql`
    UPDATE time_entries
    SET project_id = ${projectId}, customer_id = ${customerId}, started_at = ${startedAt}, ended_at = ${endedAt},
        break_minutes = ${breakMinutes}, note = ${note},
        km_driven = ${km !== null && Number.isFinite(km) ? km : null}
    WHERE id = ${id}
  `;

  revalidatePath("/zeiten");
  revalidatePath("/admin/zeiten");
  redirect("/zeiten?saved=1");
}

export async function deleteOwnTimeEntry(id: number) {
  const user = await requireUser();
  await sql`DELETE FROM time_entries WHERE id = ${id} AND user_id = ${user.userId} AND self_entered = true`;
  revalidatePath("/zeiten");
  revalidatePath("/admin/zeiten");
  redirect("/zeiten?saved=1");
}

export async function createTimeEntry(formData: FormData) {
  await requireAdmin();

  const userId = Number(requireString(formData.get("user_id"), "Mitarbeiter"));
  const projectIdRaw = optionalString(formData.get("project_id"));
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;
  const customerIdRaw = optionalString(formData.get("customer_id"));
  const customerId = customerIdRaw ? Number(customerIdRaw) : null;
  const date = requireString(formData.get("date"), "Datum");
  const startTime = requireString(formData.get("start_time"), "Von");
  const endTime = optionalString(formData.get("end_time"));
  const breakMinutesRaw = optionalString(formData.get("break_minutes"));
  const breakMinutes = breakMinutesRaw ? Number(breakMinutesRaw) : 0;
  const kmRaw = optionalString(formData.get("km_driven"));
  const km = kmRaw ? Number(kmRaw) : null;
  const note = optionalString(formData.get("note"));

  if (!Number.isInteger(userId) || (projectId !== null && !Number.isInteger(projectId))) {
    throw new Error("Ungültiger Mitarbeiter oder Auftrag.");
  }

  const startedAt = new Date(`${date}T${startTime}`);
  const endedAt = endTime ? new Date(`${date}T${endTime}`) : null;

  await sql`
    INSERT INTO time_entries
      (user_id, project_id, customer_id, started_at, ended_at, break_minutes, note, km_driven, edited_by_admin)
    VALUES (
      ${userId}, ${projectId}, ${customerId}, ${startedAt}, ${endedAt},
      ${Number.isFinite(breakMinutes) ? breakMinutes : 0}, ${note},
      ${km !== null && Number.isFinite(km) ? km : null}, true
    )
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
  const kmRaw = optionalString(formData.get("km_driven"));
  const km = kmRaw ? Number(kmRaw) : null;

  await sql`
    UPDATE time_entries
    SET break_minutes = ${Number.isFinite(breakMinutes) ? breakMinutes : 0},
        note = ${note},
        km_driven = ${km !== null && Number.isFinite(km) ? km : null},
        edited_by_admin = true
    WHERE id = ${id}
  `;

  if (endedAtRaw) {
    await sql`UPDATE time_entries SET ended_at = ${new Date(endedAtRaw)} WHERE id = ${id}`;
  }

  revalidatePath("/admin/zeiten");
  redirect("/admin/zeiten?saved=1");
}

export async function deleteTimeEntry(id: number, redirectTo: string) {
  await requireAdmin();
  await sql`DELETE FROM time_entries WHERE id = ${id}`;
  revalidatePath("/admin/zeiten");
  revalidatePath("/zeiten");
  redirect(`${redirectTo}?saved=1`);
}

export async function requestTimeEntryChange(timeEntryId: number, formData: FormData) {
  const user = await requireUser();

  const owned = await sql`
    SELECT id FROM time_entries WHERE id = ${timeEntryId} AND user_id = ${user.userId}
  `;
  if ((owned as unknown as unknown[]).length === 0) {
    throw new Error("Diese Zeit gehört dir nicht.");
  }

  const endedAtRaw = optionalString(formData.get("ended_at"));
  const breakMinutesRaw = optionalString(formData.get("break_minutes"));
  const note = optionalString(formData.get("note"));
  const reason = requireString(formData.get("reason"), "Begründung");

  await sql`
    INSERT INTO time_entry_change_requests
      (time_entry_id, requested_by, requested_ended_at, requested_break_minutes, requested_note, reason)
    VALUES (
      ${timeEntryId},
      ${user.userId},
      ${endedAtRaw ? new Date(endedAtRaw) : null},
      ${breakMinutesRaw ? Number(breakMinutesRaw) : null},
      ${note},
      ${reason}
    )
  `;

  revalidatePath("/zeiten");
  revalidatePath("/admin/zeiten");
  redirect("/zeiten?saved=1");
}

export async function reviewTimeEntryChange(
  requestId: number,
  decision: "approved" | "rejected"
) {
  const admin = await requireAdmin();

  const rows = await sql`
    SELECT * FROM time_entry_change_requests WHERE id = ${requestId} AND status = 'pending'
  `;
  const request = (
    rows as unknown as Array<{
      id: number;
      time_entry_id: number;
      requested_ended_at: unknown;
      requested_break_minutes: number | null;
      requested_note: string | null;
    }>
  )[0];

  if (request) {
    if (decision === "approved") {
      if (request.requested_ended_at !== null) {
        await sql`
          UPDATE time_entries SET ended_at = ${request.requested_ended_at} WHERE id = ${request.time_entry_id}
        `;
      }
      if (request.requested_break_minutes !== null) {
        await sql`
          UPDATE time_entries SET break_minutes = ${request.requested_break_minutes} WHERE id = ${request.time_entry_id}
        `;
      }
      if (request.requested_note !== null) {
        await sql`
          UPDATE time_entries SET note = ${request.requested_note} WHERE id = ${request.time_entry_id}
        `;
      }
      await sql`
        UPDATE time_entries SET edited_by_admin = true WHERE id = ${request.time_entry_id}
      `;
    }

    await sql`
      UPDATE time_entry_change_requests
      SET status = ${decision}, reviewed_by = ${admin.userId}, reviewed_at = now()
      WHERE id = ${requestId}
    `;
  }

  revalidatePath("/admin/zeiten");
  revalidatePath("/zeiten");
  redirect("/admin/zeiten?saved=1");
}
