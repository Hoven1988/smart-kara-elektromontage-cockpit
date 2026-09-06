export class ValidationError extends Error {}

export function requireString(value: FormDataEntryValue | null, field: string): string {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) throw new ValidationError(`${field} ist erforderlich.`);
  return str;
}

export function optionalString(value: FormDataEntryValue | null): string | null {
  const str = typeof value === "string" ? value.trim() : "";
  return str || null;
}

export function optionalNumber(value: FormDataEntryValue | null): number | null {
  const str = typeof value === "string" ? value.trim() : "";
  if (!str) return null;
  const num = Number(str.replace(",", "."));
  return Number.isFinite(num) ? num : null;
}
