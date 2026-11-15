import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { computeGewerbesteuer } from "@/lib/gewerbesteuer";
import {
  getNextUstVaDeadline,
  getWageDueDate,
  getNextTuvDue,
  isTuvDueSoon,
  isTuvOverdue,
  getTireChangeReminder,
} from "@/lib/deadlines";

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", { dateStyle: "medium" });
}

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

type Vehicle = {
  id: number;
  license_plate: string;
  vehicle_type: string;
  last_tuv: unknown;
  tire_type: string;
};

async function getVehicles(): Promise<Vehicle[]> {
  const rows = await sql`
    SELECT id, license_plate, vehicle_type, last_tuv, tire_type FROM vehicles ORDER BY license_plate ASC
  `;
  return rows as unknown as Vehicle[];
}

function nextTuvFor(v: Vehicle): Date {
  const lastTuv = v.last_tuv instanceof Date ? v.last_tuv : new Date(String(v.last_tuv));
  return getNextTuvDue(lastTuv);
}

async function sendDailyReminderIfDue(to: string, cc: string | undefined, today: Date) {
  const vehicles = await getVehicles();

  const tuvItems = vehicles.filter((v) => isTuvDueSoon(nextTuvFor(v), today));

  const tireChangeReminder = getTireChangeReminder(today);
  const seasonVehicles = tireChangeReminder ? vehicles.filter((v) => v.tire_type === "saison") : [];

  if (tuvItems.length === 0 && seasonVehicles.length === 0) {
    return { sent: false, reason: "nothing due today" };
  }

  const lines: string[] = [];
  for (const v of tuvItems) {
    const due = nextTuvFor(v);
    const overdue = isTuvOverdue(due, today);
    lines.push(
      `<li><strong>${v.license_plate}</strong> (${v.vehicle_type}) – TÜV ${
        overdue ? "überfällig seit" : "fällig am"
      } ${formatDate(due)}</li>`
    );
  }
  for (const v of seasonVehicles) {
    lines.push(
      `<li><strong>${v.license_plate}</strong> (${v.vehicle_type}) – Reifenwechsel auf ${
        tireChangeReminder === "sommer" ? "Sommerreifen" : "Winterreifen"
      } fällig</li>`
    );
  }

  const html = `
    <h2>KARA Cockpit – Erinnerung für ${formatDate(today)}</h2>
    <ul>${lines.join("")}</ul>
  `;

  await sendEmail(to, "KARA Cockpit: Erinnerung für heute", html, cc);
  return { sent: true };
}

async function sendMonthlySummary(to: string, cc: string | undefined, today: Date) {
  const year = today.getFullYear();

  const [settingsRows, vehicles] = await Promise.all([
    sql`SELECT gewinn_override, freibetrag, hebesatz FROM gewerbesteuer_settings WHERE year = ${year}`,
    getVehicles(),
  ]);
  const settings = (
    settingsRows as unknown as Array<{
      gewinn_override: number | null;
      freibetrag: number;
      hebesatz: number | null;
    }>
  )[0];

  const gewerbesteuerResult = settings
    ? computeGewerbesteuer({
        gewinn: settings.gewinn_override,
        freibetrag: settings.freibetrag,
        hebesatz: settings.hebesatz,
      })
    : null;

  const ustVaDeadline = getNextUstVaDeadline(today);
  const wageDueDate = getWageDueDate(today);

  const inThreeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
  const upcomingTuv = vehicles.filter((v) => nextTuvFor(v) <= inThreeMonths);

  const gewerbesteuerLine = gewerbesteuerResult
    ? `<li>Geschätzte Gewerbesteuer ${year}: ${formatEuro(gewerbesteuerResult.gewerbesteuer)}</li>`
    : `<li>Gewerbesteuer ${year}: noch kein Gewinn/Hebesatz hinterlegt.</li>`;

  const tuvLines = upcomingTuv
    .map((v) => `<li>${v.license_plate} (${v.vehicle_type}): TÜV fällig am ${formatDate(nextTuvFor(v))}</li>`)
    .join("");

  const html = `
    <h2>KARA Cockpit – Monatsübersicht ${today.toLocaleDateString("de-DE", { month: "long", year: "numeric" })}</h2>
    <ul>
      ${gewerbesteuerLine}
      <li>Nächste Umsatzsteuer-Voranmeldung: ${formatDate(ustVaDeadline)}</li>
      <li>Lohnzahlung diesen Monat: ${formatDate(wageDueDate)}</li>
    </ul>
    ${
      tuvLines
        ? `<h3>TÜV-Termine in den nächsten 3 Monaten</h3><ul>${tuvLines}</ul>`
        : "<p>Keine TÜV-Termine in den nächsten 3 Monaten.</p>"
    }
  `;

  await sendEmail(to, "KARA Cockpit: Monatsübersicht", html, cc);
  return { sent: true };
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const to = process.env.REMINDER_EMAIL_TO;
  if (!to) {
    return NextResponse.json({ skipped: "REMINDER_EMAIL_TO nicht gesetzt" });
  }
  const cc = process.env.REMINDER_EMAIL_CC || undefined;

  const today = new Date();
  try {
    const result =
      today.getDate() === 1
        ? await sendMonthlySummary(to, cc, today)
        : await sendDailyReminderIfDue(to, cc, today);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
