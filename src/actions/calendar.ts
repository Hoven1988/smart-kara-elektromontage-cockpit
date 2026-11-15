"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function createCalendarEntry(formData: FormData) {
  await requireAdmin();

  const date = requireString(formData.get("date"), "Datum");
  const title = requireString(formData.get("title"), "Titel");
  const note = optionalString(formData.get("note"));

  await sql`
    INSERT INTO calendar_entries (date, title, note)
    VALUES (${date}, ${title}, ${note})
  `;

  revalidatePath("/admin/kalender");
  revalidatePath("/admin");
  redirect("/admin/kalender?saved=1");
}

/**
 * Wird direkt aus einem Client-Event-Handler aufgerufen (Checkbox), nicht
 * aus einem <form action> - deshalb kein redirect() (würde im Client-
 * try/catch fälschlich als Fehler ankommen, siehe PhotoUploadForm).
 */
export async function setCalendarEntryDone(id: number, done: boolean) {
  await requireAdmin();
  await sql`UPDATE calendar_entries SET done = ${done} WHERE id = ${id}`;
  revalidatePath("/admin/kalender");
  revalidatePath("/admin");
}

export async function deleteCalendarEntry(id: number) {
  await requireAdmin();
  await sql`DELETE FROM calendar_entries WHERE id = ${id}`;
  revalidatePath("/admin/kalender");
  revalidatePath("/admin");
  redirect("/admin/kalender?saved=1");
}
