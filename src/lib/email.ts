const RESEND_API_URL = "https://api.resend.com/emails";

// resend.dev-Absender funktioniert ohne eigene Domain-Verifizierung bei
// Resend - ausreichend für interne Erinnerungsmails. Bei Bedarf später auf
// eine verifizierte eigene Domain umstellen.
const FROM_ADDRESS = "KARA Cockpit <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY fehlt.");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Resend antwortete mit Status ${res.status}: ${bodyText.slice(0, 300)}`);
  }
}
