import { sql } from "@/lib/db";

// Arbeitszeitgesetz (ArbZG) §4: Pausenpflicht ab 6 bzw. 9 Stunden Arbeitszeit.
export function autoBreakMinutes(grossMinutes: number): number {
  if (grossMinutes > 9 * 60) return 45;
  if (grossMinutes > 6 * 60) return 30;
  return 0;
}

// ArbZG §3: werktägliche Höchstarbeitszeit, auch im Ausnahmefall max. 10 Stunden.
export const MAX_WORK_HOURS = 10;

/**
 * Schließt Zeiteinträge, die seit mehr als MAX_WORK_HOURS offen sind, automatisch
 * (z.B. vergessenes Ausstempeln). Läuft serverlos ohne eigenen Hintergrundjob,
 * daher wird hier bei jedem relevanten Seitenaufruf nachgeholt statt per Cron.
 */
export async function closeExpiredTimeEntries(): Promise<void> {
  await sql`
    UPDATE time_entries
    SET ended_at = started_at + interval '10 hours', break_minutes = 45
    WHERE ended_at IS NULL AND started_at <= now() - interval '10 hours'
  `;
}
