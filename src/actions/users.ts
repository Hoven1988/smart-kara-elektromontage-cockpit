"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

export async function createEmployee(formData: FormData) {
  await requireAdmin();

  const name = requireString(formData.get("name"), "Name");
  const username = requireString(formData.get("username"), "Benutzername");
  const password = requireString(formData.get("password"), "Passwort");
  const roleRaw = formData.get("role");
  const role = roleRaw === "admin" ? "admin" : "monteur";
  const vacationDaysRaw = optionalString(formData.get("vacation_days_per_year"));
  const vacationDays = vacationDaysRaw ? Number(vacationDaysRaw) : 30;

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await sql`
      INSERT INTO users (name, username, password_hash, role, vacation_days_per_year)
      VALUES (${name}, ${username}, ${passwordHash}, ${role}, ${Number.isFinite(vacationDays) ? vacationDays : 30})
    `;
  } catch (err) {
    if (err && typeof err === "object" && "code" in err && err.code === "23505") {
      redirect("/admin/mitarbeiter/neu?error=duplicate-username");
    }
    throw err;
  }

  revalidatePath("/admin/mitarbeiter");
}

export async function setEmployeeActive(id: number, active: boolean) {
  await requireAdmin();
  await sql`UPDATE users SET active = ${active} WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
  redirect(`/admin/mitarbeiter/${id}?saved=1`);
}

export async function deleteEmployee(id: number) {
  await requireAdmin();

  const [times, assignments, material, service, docs] = await Promise.all([
    sql`SELECT 1 FROM time_entries WHERE user_id = ${id} LIMIT 1`,
    sql`SELECT 1 FROM assignments WHERE user_id = ${id} LIMIT 1`,
    sql`SELECT 1 FROM material_entries WHERE user_id = ${id} LIMIT 1`,
    sql`SELECT 1 FROM service_entries WHERE user_id = ${id} LIMIT 1`,
    sql`SELECT 1 FROM doc_entries WHERE user_id = ${id} LIMIT 1`,
  ]);
  const hasHistory = [times, assignments, material, service, docs].some(
    (rows) => (rows as unknown as unknown[]).length > 0
  );

  if (hasHistory) {
    redirect(`/admin/mitarbeiter/${id}?error=has-history`);
  }

  await sql`DELETE FROM users WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
  redirect("/admin/mitarbeiter?saved=1");
}

export async function resetEmployeePassword(id: number, formData: FormData) {
  await requireAdmin();
  const password = requireString(formData.get("password"), "Neues Passwort");
  const passwordHash = await bcrypt.hash(password, 10);
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
  redirect(`/admin/mitarbeiter/${id}?saved=1`);
}

export async function updateVacationDays(id: number, formData: FormData) {
  await requireAdmin();
  const vacationDays = Number(requireString(formData.get("vacation_days_per_year"), "Urlaubsanspruch"));
  if (!Number.isFinite(vacationDays) || vacationDays < 0) {
    throw new Error("Ungültiger Urlaubsanspruch.");
  }
  await sql`UPDATE users SET vacation_days_per_year = ${vacationDays} WHERE id = ${id}`;
  revalidatePath("/admin/mitarbeiter");
  redirect(`/admin/mitarbeiter/${id}?saved=1`);
}
