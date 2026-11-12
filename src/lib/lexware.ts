const BASE_URL = "https://api.lexware.io";

type VoucherListItem = {
  voucherType: string;
  voucherStatus: string;
  totalAmount: number;
};

type VoucherListResponse = {
  content: VoucherListItem[];
  last: boolean;
};

async function fetchVoucherPage(
  apiKey: string,
  voucherTypes: string,
  dateFrom: string,
  dateTo: string,
  page: number
): Promise<VoucherListResponse> {
  const params = new URLSearchParams({
    voucherType: voucherTypes,
    voucherStatus: "any",
    voucherDateFrom: dateFrom,
    voucherDateTo: dateTo,
    page: String(page),
    size: "250",
  });

  const res = await fetch(`${BASE_URL}/v1/voucherlist?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Lexware-API antwortete mit Status ${res.status}: ${bodyText.slice(0, 300)}`);
  }

  return (await res.json()) as VoucherListResponse;
}

async function sumVoucherType(
  apiKey: string,
  voucherType: string,
  dateFrom: string,
  dateTo: string
): Promise<number> {
  let page = 0;
  let total = 0;
  for (;;) {
    const data = await fetchVoucherPage(apiKey, voucherType, dateFrom, dateTo, page);
    for (const item of data.content) {
      if (item.voucherStatus === "draft" || item.voucherStatus === "voided") continue;
      total += item.totalAmount;
    }
    if (data.last) break;
    page += 1;
  }
  return total;
}

export type YearSummary = {
  umsatz: number;
  ausgaben: number;
};

/**
 * Grobe Näherung aus Lexware-Belegen (Rechnungssummen abzüglich Gutschriften)
 * - KEIN testierter Jahresabschluss. Berücksichtigt weder Abschreibungen noch
 * Privatentnahmen/-einlagen noch Rückstellungen. Dient nur als Startwert für
 * die manuelle Gewinn-Eingabe in der Gewerbesteuer-Schätzung.
 */
export async function fetchYearSummary(apiKey: string, year: number): Promise<YearSummary> {
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;

  // Nacheinander statt parallel, um das Rate-Limit der Lexware-API nicht zu
  // überschreiten (429 Too Many Requests bei zu vielen gleichzeitigen Anfragen).
  const salesInvoices = await sumVoucherType(apiKey, "salesinvoice", dateFrom, dateTo);
  const salesCredits = await sumVoucherType(apiKey, "salescreditnote", dateFrom, dateTo);
  const purchaseInvoices = await sumVoucherType(apiKey, "purchaseinvoice", dateFrom, dateTo);
  const purchaseCredits = await sumVoucherType(apiKey, "purchasecreditnote", dateFrom, dateTo);

  return {
    umsatz: salesInvoices - salesCredits,
    ausgaben: purchaseInvoices - purchaseCredits,
  };
}
