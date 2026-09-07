"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString } from "@/lib/validation";

export async function createEmployee(formData: FormData) {
  await requireAdmin();

  const name = requireString(formData.get("name"), "Name");
  const username = requireString(formData.get("username"), "Benutzername");
  const password = requireString(formData.get("password"), "Passwort");
  const roleRaw = formData.get("role");
  const role = roleRaw === "admin" ? "admin" : "monteur";

  const passwordHash = await bcrypt.hash(password, 10);

  await sql`
    INSERT INTO users (name, username, password_hash, role)
    VALUES (${name}, ${username}, ${passwordHash}, ${role})
  `;

  revalidatePath("/admin/mitarbeiter");
}

export async function setEmployeeActive(id: number, active: boolean) {
  await requireAdmin();
  await sql`UPDATE users SET active = ${active} WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
}

export async function resetEmployeePassword(id: number, formData: FormData) {
  await requireAdmin();
  const password = requireString(formData.get("password"), "Neues Passwort");
  const passwordHash = await bcrypt.hash(password, 10);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
}
