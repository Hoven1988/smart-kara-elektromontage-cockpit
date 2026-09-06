"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function createCustomer(formData: FormData) {
  await requireAdmin();

  const name = requireString(formData.get("name"), "Name");
  const contactPerson = optionalString(formData.get("contact_person"));
  const email = optionalString(formData.get("email"));
  const phone = optionalString(formData.get("phone"));
  const address = optionalString(formData.get("address"));
  const notes = optionalString(formData.get("notes"));

  const rows = await sql`
    INSERT INTO customers (name, contact_person, email, phone, address, notes)
    VALUES (${name}, ${contactPerson}, ${email}, ${phone}, ${address}, ${notes})
    RETURNING id
  `;

  const newId = (rows as unknown as Array<{ id: number }>)[0].id;
  revalidatePath("/admin/kunden");
  redirect(`/admin/kunden/${newId}`);
}

export async function updateCustomer(id: number, formData: FormData) {
  await requireAdmin();

  const name = requireString(formData.get("name"), "Name");
  const contactPerson = optionalString(formData.get("contact_person"));
  const email = optionalString(formData.get("email"));
  const phone = optionalString(formData.get("phone"));
  const address = optionalString(formData.get("address"));
  const notes = optionalString(formData.get("notes"));

  await sql`
    UPDATE customers
    SET name = ${name}, contact_person = ${contactPerson}, email = ${email},
        phone = ${phone}, address = ${address}, notes = ${notes}
    WHERE id = ${id}
  `;

  revalidatePath("/admin/kunden");
  revalidatePath(`/admin/kunden/${id}`);
}
