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
