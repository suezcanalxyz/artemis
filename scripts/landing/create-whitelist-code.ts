import { randomBytes } from "node:crypto";
import { sql } from "../../src/lib/db.js";

type Args = {
  code?: string;
  note?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--code") args.code = argv[index + 1];
    if (value === "--note") args.note = argv[index + 1];
  }

  return args;
}

function defaultCode() {
  return `ART-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const code = (args.code ?? defaultCode()).trim().toUpperCase();
  const note = args.note?.trim() || null;

  const [created] = await sql<{ code: string; note: string | null }[]>`
    insert into whitelist_codes (code, note)
    values (${code}, ${note})
    returning code, note
  `;

  console.log(JSON.stringify(created, null, 2));
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end();
  process.exit(1);
});
