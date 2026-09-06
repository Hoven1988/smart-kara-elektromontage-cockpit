import postgres from "postgres";

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL fehlt (siehe .env.example).");
    }
    client = postgres(process.env.DATABASE_URL, { ssl: "require" });
  }
  return client;
}

/** Lazy, damit Seiten ohne DB-Zugriff auch ohne DATABASE_URL bauen/laufen. */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = getClient() as unknown as (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => ReturnType<ReturnType<typeof postgres>>;
  return client(strings, ...values);
}
