const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

async function check(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Smoke check failed for ${path}: ${response.status}`);
  }
}

async function main() {
  console.log(`Checking ${baseUrl}/api/health`);
  await check("/api/health");

  console.log(`Checking ${baseUrl}/api/ready`);
  await check("/api/ready");

  console.log("Smoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
