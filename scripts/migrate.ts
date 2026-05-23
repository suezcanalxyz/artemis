import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { config } from "../src/config.js";

const sql = postgres(config.DATABASE_URL, { max: 1 });
async function ensureMigrationsTable() {
  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;
}

async function appliedMigrations() {
  const rows = await sql<
    { name: string }[]
  >`select name from schema_migrations`;
  return new Set(rows.map((row) => row.name));
}

async function main() {
  await ensureMigrationsTable();
  const applied = await appliedMigrations();
  const dir = path.resolve("migrations");
  const files = (await readdir(dir))
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const contents = await readFile(path.join(dir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`insert into schema_migrations (name) values (${file})`;
    });
  }
}

main()
  .then(async () => {
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
