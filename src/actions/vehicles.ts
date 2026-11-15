"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

function tireType(formData: FormData): "ganzjahr" | "saison" {
  return formData.get("tire_type") === "saison" ? "saison" : "ganzjahr";
}

export async function createVehicle(formData: FormData) {
  await requireAdmin();

  const licensePlate = requireString(formData.get("license_plate"), "Kennzeichen");
  const vehicleType = requireString(formData.get("vehicle_type"), "Fahrzeugtyp");
  const lastTuv = requireString(formData.get("last_tuv"), "Letzter TÜV");
  const note = optionalString(formData.get("note"));

  await sql`
    INSERT INTO vehicles (license_plate, vehicle_type, last_tuv, tire_type, note)
    VALUES (${licensePlate}, ${vehicleType}, ${lastTuv}, ${tireType(formData)}, ${note})
  `;

  revalidatePath("/admin/fuhrpark");
  revalidatePath("/admin");
  redirect("/admin/fuhrpark?saved=1");
}

export async function updateVehicle(id: number, formData: FormData) {
  await requireAdmin();

  const licensePlate = requireString(formData.get("license_plate"), "Kennzeichen");
  const vehicleType = requireString(formData.get("vehicle_type"), "Fahrzeugtyp");
  const lastTuv = requireString(formData.get("last_tuv"), "Letzter TÜV");
  const note = optionalString(formData.get("note"));

  await sql`
    UPDATE vehicles
    SET license_plate = ${licensePlate}, vehicle_type = ${vehicleType}, last_tuv = ${lastTuv},
        tire_type = ${tireType(formData)}, note = ${note}
    WHERE id = ${id}
  `;

  revalidatePath("/admin/fuhrpark");
  revalidatePath("/admin");
  redirect(`/admin/fuhrpark/${id}?saved=1`);
}

export async function deleteVehicle(id: number) {
  await requireAdmin();
  await sql`DELETE FROM vehicles WHERE id = ${id}`;
  revalidatePath("/admin/fuhrpark");
  revalidatePath("/admin");
  redirect("/admin/fuhrpark?saved=1");
}
