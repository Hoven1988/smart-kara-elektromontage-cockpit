const BASE_URL = "https://api.lexware.io";

type VoucherListItem = {
  id: string;
  voucherType: string;
  voucherStatus: string;
  voucherNumber: string;
  voucherDate: string;
  dueDate?: string;
  contactName?: string;
  totalAmount: number;
  openAmount: number;
};

type VoucherListResponse = {
  content: VoucherListItem[];
  last: boolean;
};

async function fetchVoucherPage(
  apiKey: string,
  voucherTypes: string,
  voucherStatus: string,
  dateFrom: string,
  dateTo: string,
  page: number
): Promise<VoucherListResponse> {
  const params = new URLSearchParams({
    voucherType: voucherTypes,
    voucherStatus,
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
    const retryAfter = res.headers.get("retry-after") ?? res.headers.get("x-ratelimit-reset");
    const retryInfo = retryAfter ? ` (retry-after: ${retryAfter})` : " (kein retry-after-Header gesendet)";
    throw new Error(
      `Lexware-API antwortete mit Status ${res.status}${retryInfo}: ${bodyText.slice(0, 300)}`
    );
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
    const data = await fetchVoucherPage(apiKey, voucherType, "any", dateFrom, dateTo, page);
    for (const item of data.content) {
      if (item.voucherStatus === "draft" || item.voucherStatus === "voided") continue;
      total += item.totalAmount;
    }
    if (data.last) break;
    page += 1;
  }
  return total;
}

export type OpenInvoice = {
  id: string;
  voucherNumber: string;
  contactName: string;
  dueDate: string | null;
  openAmount: number;
};

/**
 * Offene Rechnungen eines Belegtyps (Status "open"/"overdue"), sortiert
 * nach Fälligkeit. Da nur offene Posten abgefragt werden, bleibt die
 * Trefferzahl normalerweise klein - meist genügt eine Seite.
 */
async function fetchOpenVouchers(
  apiKey: string,
  voucherType: string,
  dateFrom: string,
  dateTo: string
): Promise<OpenInvoice[]> {
  const result: OpenInvoice[] = [];
  let page = 0;
  for (;;) {
    const data = await fetchVoucherPage(apiKey, voucherType, "open,overdue", dateFrom, dateTo, page);
    for (const item of data.content) {
      result.push({
        id: item.id,
        voucherNumber: item.voucherNumber,
        contactName: item.contactName ?? "–",
        dueDate: item.dueDate ?? null,
        openAmount: item.openAmount,
      });
    }
    if (data.last) break;
    page += 1;
  }
  return result.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
}

export type LiquiditySnapshot = {
  openSales: OpenInvoice[];
  openPurchases: OpenInvoice[];
};

/**
 * Offene Ausgangsrechnungen (Geld, das noch reinkommt) und offene
 * Eingangsrechnungen (Geld, das noch raus muss - "Abbuchungen"). Begrenzt
 * auf die letzten 2 Jahre, damit die Anfrage nicht ausufert; ältere offene
 * Posten sind ohnehin ein Sonderfall, der manuell geprüft werden sollte.
 */
export async function fetchLiquiditySnapshot(apiKey: string): Promise<LiquiditySnapshot> {
  const today = new Date();
  const dateFrom = `${today.getFullYear() - 2}-01-01`;
  const dateTo = `${today.getFullYear()}-12-31`;

  // Nacheinander statt parallel, um das Rate-Limit nicht zu überschreiten.
  const openSales = await fetchOpenVouchers(apiKey, "salesinvoice", dateFrom, dateTo);
  const openPurchases = await fetchOpenVouchers(apiKey, "purchaseinvoice", dateFrom, dateTo);

  return { openSales, openPurchases };
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
