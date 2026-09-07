"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";
import { parseProjectStatus } from "@/lib/project-status";

function parseCustomerId(value: FormDataEntryValue | null): number | null {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return null;
  const num = Number(str);
  return Number.isInteger(num) ? num : null;
}

export async function createProject(formData: FormData) {
  const admin = await requireAdmin();

  const title = requireString(formData.get("title"), "Titel");
  const customerId = parseCustomerId(formData.get("customer_id"));
  const address = optionalString(formData.get("address"));
  const status = parseProjectStatus(formData.get("status") as string | null);
  const description = optionalString(formData.get("description"));
  const startDate = optionalString(formData.get("start_date"));
  const endDate = optionalString(formData.get("end_date"));

  const rows = await sql`
    INSERT INTO projects (title, customer_id, address, status, description, start_date, end_date, created_by)
    VALUES (${title}, ${customerId}, ${address}, ${status}, ${description}, ${startDate}, ${endDate}, ${admin.userId})
    RETURNING id
  `;

  const newId = (rows as unknown as Array<{ id: number }>)[0].id;
  revalidatePath("/admin/auftraege");
  redirect(`/admin/auftraege/${newId}?saved=1`);
}

export async function updateProject(id: number, formData: FormData) {
  await requireAdmin();

  const title = requireString(formData.get("title"), "Titel");
  const customerId = parseCustomerId(formData.get("customer_id"));
  const address = optionalString(formData.get("address"));
  const status = parseProjectStatus(formData.get("status") as string | null);
  const description = optionalString(formData.get("description"));
  const startDate = optionalString(formData.get("start_date"));
  const endDate = optionalString(formData.get("end_date"));

  await sql`
    UPDATE projects
    SET title = ${title}, customer_id = ${customerId}, address = ${address},
        status = ${status}, description = ${description},
        start_date = ${startDate}, end_date = ${endDate}
    WHERE id = ${id}
  `;

  revalidatePath("/admin/auftraege");
  revalidatePath(`/admin/auftraege/${id}`);
  redirect(`/admin/auftraege/${id}?saved=1`);
}
