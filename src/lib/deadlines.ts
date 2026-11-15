function shiftToBusinessDay(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  if (day === 6) result.setDate(result.getDate() + 2);
  else if (day === 0) result.setDate(result.getDate() + 1);
  return result;
}

/**
 * Nächste Fälligkeit der quartalsweisen Umsatzsteuer-Voranmeldung:
 * 10 Tage nach Quartalsende (10.4., 10.7., 10.10., 10.1. des Folgejahres).
 * Fällt der 10. auf ein Wochenende, verschiebt sich die Frist auf den
 * nächsten Werktag. Berücksichtigt keine Feiertage und keine
 * Dauerfristverlängerung.
 */
export function getNextUstVaDeadline(from: Date): Date {
  const year = from.getFullYear();
  const candidates = [
    new Date(year, 3, 10), // Q1 -> 10. April
    new Date(year, 6, 10), // Q2 -> 10. Juli
    new Date(year, 9, 10), // Q3 -> 10. Oktober
    new Date(year + 1, 0, 10), // Q4 -> 10. Januar Folgejahr
  ].map(shiftToBusinessDay);

  const upcoming = candidates.find((d) => d >= from);
  return upcoming ?? shiftToBusinessDay(new Date(year + 1, 3, 10));
}

/** Letzter Werktag (Mo-Fr) des Monats von `from` - Fälligkeit für Löhne. */
export function getWageDueDate(from: Date): Date {
  const lastDayOfMonth = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  const result = new Date(lastDayOfMonth);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() - 1);
  }
  return result;
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/** Nächster TÜV = letzter TÜV + 2 Jahre (Standard-Intervall für Pkw/Transporter bis 3,5t). */
export function getNextTuvDue(lastTuv: Date): Date {
  const result = new Date(lastTuv);
  result.setFullYear(result.getFullYear() + 2);
  return result;
}

/** TÜV-Erinnerung: fällig in <= 21 Tagen (3 Wochen) oder bereits überfällig. */
export function isTuvDueSoon(nextTuvDue: Date, today: Date): boolean {
  return daysBetween(today, nextTuvDue) <= 21;
}

export function isTuvOverdue(nextTuvDue: Date, today: Date): boolean {
  return daysBetween(today, nextTuvDue) < 0;
}

/** true, wenn `today` ein Montag ist - treibt die wöchentliche Terminvorschau. */
export function isMonday(today: Date): boolean {
  return today.getDay() === 1;
}

/**
 * Saisonreifen-Wechsel-Erinnerung: 1.3. (auf Sommerreifen) und 1.10. (auf
 * Winterreifen), jeweils 2 Wochen lang sichtbar, damit sie nicht verpasst
 * wird, falls das Cockpit nicht genau am Stichtag geöffnet wird.
 */
export function getTireChangeReminder(today: Date): "sommer" | "winter" | null {
  const year = today.getFullYear();
  const march1 = new Date(year, 2, 1);
  const march14 = new Date(year, 2, 14);
  const oct1 = new Date(year, 9, 1);
  const oct14 = new Date(year, 9, 14);

  if (today >= march1 && today <= march14) return "sommer";
  if (today >= oct1 && today <= oct14) return "winter";
  return null;
}
