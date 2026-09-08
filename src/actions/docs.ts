"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function uploadProjectPhoto(projectId: number, formData: FormData) {
  const user = await requireUser();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Bitte ein Foto auswählen.");
  }
  const text = optionalString(formData.get("text"));

  const blob = await put(`project-${projectId}-${Date.now()}-${file.name}`, file, {
    access: "public",
  });

  await sql`
    INSERT INTO doc_entries (project_id, user_id, type, blob_url, text)
    VALUES (${projectId}, ${user.userId}, 'photo', ${blob.url}, ${text})
  `;

  const returnTo = optionalString(formData.get("_redirect")) ?? `/auftrag/${projectId}`;
  revalidatePath(`/auftrag/${projectId}`);
  revalidatePath(`/admin/auftraege/${projectId}`);
  redirect(`${returnTo}?saved=1`);
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
