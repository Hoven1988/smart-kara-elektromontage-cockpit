"use server";

import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export type DeadlineType = "lohn" | "ust";

/**
 * Markiert eine wiederkehrende Frist (Lohnzahlung/Umsatzsteuer-Voranmeldung)
 * für ein konkretes Fälligkeitsdatum als erledigt. Da sich das Datum jede
 * Periode ändert, setzt sich der Haken für die nächste Periode automatisch
 * zurück - kein manuelles Reset nötig. Kein redirect(), da direkt aus einem
 * Client-Event-Handler (Checkbox) aufgerufen.
 */
export async function setDeadlineDone(type: DeadlineType, dueDate: string, done: boolean) {
  await requireAdmin();

  if (done) {
    await sql`
      INSERT INTO completed_deadlines (type, due_date)
      VALUES (${type}, ${dueDate})
      ON CONFLICT (type, due_date) DO NOTHING
    `;
  } else {
    await sql`DELETE FROM completed_deadlines WHERE type = ${type} AND due_date = ${dueDate}`;
  }

  revalidatePath("/admin");
}
