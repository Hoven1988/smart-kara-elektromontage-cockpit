import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL fehlt. Ausführen mit: npm run db:seed");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "kara-admin-2026";
  const monteurPassword = process.env.SEED_MONTEUR_PASSWORD || "kara-monteur-2026";

  const adminHash = await bcrypt.hash(adminPassword, 10);
  const monteurHash = await bcrypt.hash(monteurPassword, 10);

  await sql`
    INSERT INTO users (name, username, password_hash, role)
    VALUES ('Admin', 'admin', ${adminHash}, 'admin')
    ON CONFLICT (username) DO NOTHING
  `;
  await sql`
    INSERT INTO users (name, username, password_hash, role)
    VALUES ('Test-Monteur', 'monteur', ${monteurHash}, 'monteur')
    ON CONFLICT (username) DO NOTHING
  `;

  console.log("Seed abgeschlossen. Test-Zugänge (bitte danach Passwörter ändern):");
  console.log(`  admin   / ${adminPassword}`);
  console.log(`  monteur / ${monteurPassword}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
