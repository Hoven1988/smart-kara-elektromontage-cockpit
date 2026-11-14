export function computeGewerbesteuer({
  gewinn,
  freibetrag,
  hebesatz,
}: {
  gewinn: number | null;
  freibetrag: number;
  hebesatz: number | null;
}): { steuermessbetrag: number; gewerbesteuer: number } | null {
  if (gewinn === null || hebesatz === null) return null;

  const gewerbeertrag = Math.floor(gewinn / 100) * 100;
  const steuerpflichtig = Math.max(0, gewerbeertrag - freibetrag);
  const steuermessbetrag = steuerpflichtig * 0.035;
  const gewerbesteuer = steuermessbetrag * (hebesatz / 100);

  return { steuermessbetrag, gewerbesteuer };
}
