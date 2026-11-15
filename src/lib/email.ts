const RESEND_API_URL = "https://api.resend.com/emails";

// resend.dev-Absender funktioniert ohne eigene Domain-Verifizierung bei
// Resend - ausreichend für interne Erinnerungsmails. Bei Bedarf später auf
// eine verifizierte eigene Domain umstellen.
const FROM_ADDRESS = "Hoven - smart Digital e.K. <onboarding@resend.dev>";

async function sendViaResend(apiKey: string, to: string, subject: string, html: string, cc?: string) {
  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, cc, subject, html }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    throw new Error(`Resend antwortete mit Status ${res.status}: ${bodyText.slice(0, 300)}`);
  }
}

/**
 * Schickt bei gesetztem `cc` zunächst mit CC. Schlägt das fehl (z.B. weil
 * die Domain bei Resend noch nicht verifiziert ist und CC an eine andere
 * Adresse als die Haupt-Testadresse deshalb abgelehnt wird), wird ohne CC
 * erneut versucht - damit ein falsch konfiguriertes CC nicht die komplette
 * Erinnerung verhindert.
 */
export async function sendEmail(to: string, subject: string, html: string, cc?: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY fehlt.");
  }

  if (!cc) {
    await sendViaResend(apiKey, to, subject, html);
    return;
  }

  try {
    await sendViaResend(apiKey, to, subject, html, cc);
  } catch (err) {
    console.error("E-Mail mit CC fehlgeschlagen, versuche ohne CC:", err);
    await sendViaResend(apiKey, to, subject, html);
  }
}
