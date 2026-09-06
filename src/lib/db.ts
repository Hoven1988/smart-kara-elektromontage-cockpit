import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL fehlt (siehe .env.example).");
    }
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

/** Lazy, damit Seiten ohne DB-Zugriff auch ohne DATABASE_URL bauen/laufen. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  return getClient()(strings, ...values);
}
