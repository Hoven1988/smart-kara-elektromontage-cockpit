import postgres from "postgres";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL fehlt. Ausführen mit: npm run db:migrate");
    process.exit(1);
  }

  const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
  const sql = postgres(databaseUrl, { ssl: "require" });
  try {
    await sql.unsafe(schema);
    console.log("Schema erfolgreich angewendet.");
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
