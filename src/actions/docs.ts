"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

/**
 * Wird aufgerufen, nachdem das Foto bereits direkt vom Browser zu Vercel
 * Blob hochgeladen wurde (siehe PhotoUploadForm) - hier landet nur noch
 * die fertige Blob-URL, kein Dateiinhalt mehr, damit wir nicht an das
 * ~4,5-MB-Limit von Server Actions/Functions stoßen.
 *
 * Löst absichtlich KEIN redirect() aus (wird direkt aus einem Client-
 * Event-Handler aufgerufen, nicht aus einem <form action>) - dessen
 * Redirect-Signal würde sonst vom eigenen try/catch im Client als
 * Fehler missverstanden. Die Weiterleitung übernimmt PhotoUploadForm
 * selbst per router.push().
 */
export async function createPhotoDocEntry(projectId: number, blobUrl: string, text: string | null) {
  const user = await requireUser();

  await sql`
    INSERT INTO doc_entries (project_id, user_id, type, blob_url, text)
    VALUES (${projectId}, ${user.userId}, 'photo', ${blobUrl}, ${text})
  `;

  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
}

export async function addProjectNote(projectId: number, formData: FormData) {
  const user = await requireUser();

  const text = requireString(formData.get("text"), "Notiz");

  await sql`
    INSERT INTO doc_entries (project_id, user_id, type, text)
    VALUES (${projectId}, ${user.userId}, 'note', ${text})
  `;

  const returnTo = optionalString(formData.get("_redirect")) ?? `/auftrag/${projectId}`;
  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
  redirect(`${returnTo}?saved=1`);
}
