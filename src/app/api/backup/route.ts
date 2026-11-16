import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Exportiert alle fachlichen Daten als JSON zum Download. Absichtlich OHNE
 * password_hash (Sicherheitsrisiko, falls die Datei mal weitergegeben
 * wird) - Zugänge müssten im Ernstfall ohnehin über "Passwort
 * zurücksetzen" neu vergeben werden, nicht aus einem Backup wiederhergestellt.
 *
 * Nacheinander statt parallel abgefragt: der Supabase-Pooler hängt sich bei
 * zu vielen gleichzeitigen Verbindungen auf (13 parallele Queries liefen
 * nie zurück, nacheinander funktioniert zuverlässig).
 */
export async function GET() {
  await requireAdmin();

  const users = await sql`SELECT id, name, username, role, active, vacation_days_per_year, created_at FROM users ORDER BY id`;
  const customers = await sql`SELECT * FROM customers ORDER BY id`;
  const projects = await sql`SELECT * FROM projects ORDER BY id`;
  const assignments = await sql`SELECT * FROM assignments ORDER BY id`;
  const timeEntries = await sql`SELECT * FROM time_entries ORDER BY id`;
  const materialEntries = await sql`SELECT * FROM material_entries ORDER BY id`;
  const serviceEntries = await sql`SELECT * FROM service_entries ORDER BY id`;
  const docEntries = await sql`SELECT * FROM doc_entries ORDER BY id`;
  const vehicles = await sql`SELECT * FROM vehicles ORDER BY id`;
  const calendarEntries = await sql`SELECT * FROM calendar_entries ORDER BY id`;
  const leaveRequests = await sql`SELECT * FROM leave_requests ORDER BY id`;
  const gewerbesteuerSettings = await sql`SELECT * FROM gewerbesteuer_settings ORDER BY year`;
  const completedDeadlines = await sql`SELECT * FROM completed_deadlines ORDER BY id`;

  const backup = {
    exportedAt: new Date().toISOString(),
    users,
    customers,
    projects,
    assignments,
    timeEntries,
    materialEntries,
    serviceEntries,
    docEntries,
    vehicles,
    calendarEntries,
    leaveRequests,
    gewerbesteuerSettings,
    completedDeadlines,
  };

  const filename = `kara-cockpit-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
