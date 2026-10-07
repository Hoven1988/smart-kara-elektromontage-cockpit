"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth";
import { requireString, optionalString } from "@/lib/validation";

function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

export async function requestLeave(formData: FormData) {
  const user = await requireUser();

  const startDateRaw = requireString(formData.get("start_date"), "Von");
  const endDateRaw = requireString(formData.get("end_date"), "Bis");
  const note = optionalString(formData.get("note"));

  const startDate = new Date(`${startDateRaw}T00:00:00`);
  const endDate = new Date(`${endDateRaw}T00:00:00`);
  if (endDate < startDate) {
    throw new Error("Das Enddatum darf nicht vor dem Startdatum liegen.");
  }

  const days = countBusinessDays(startDate, endDate);
  if (days <= 0) {
    throw new Error("Der gewählte Zeitraum enthält keine Werktage.");
  }

  await sql`
    INSERT INTO leave_requests (user_id, start_date, end_date, days, note)
    VALUES (${user.userId}, ${startDateRaw}, ${endDateRaw}, ${days}, ${note})
  `;

  revalidatePath("/urlaub");
  revalidatePath("/admin/urlaub");
  redirect("/urlaub?saved=1");
}

export async function cancelLeaveRequest(id: number) {
  const user = await requireUser();

  await sql`
    DELETE FROM leave_requests
    WHERE id = ${id} AND user_id = ${user.userId} AND status = 'pending'
  `;

  revalidatePath("/urlaub");
  revalidatePath("/admin/urlaub");
  redirect("/urlaub?saved=1");
}

export async function reviewLeaveRequest(requestId: number, decision: "approved" | "rejected") {
  const admin = await requireAdmin();

  await sql`
    UPDATE leave_requests
    SET status = ${decision}, reviewed_by = ${admin.userId}, reviewed_at = now()
    WHERE id = ${requestId} AND status = 'pending'
  `;

  revalidatePath("/admin/urlaub");
  revalidatePath("/urlaub");
  redirect("/admin/urlaub?saved=1");
}
