const baseUrl = process.env.APP_URL ?? "http://localhost:3000";

async function check(path: string) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`Smoke check failed for ${path}: ${response.status}`);
  }
  return response;
}

async function main() {
  console.log(`Checking ${baseUrl}/`);
  await check("/");

  console.log(`Checking ${baseUrl}/project`);
  await check("/project");

  console.log(`Checking ${baseUrl}/how-to-use`);
  await check("/how-to-use");

  console.log(`Checking ${baseUrl}/collaborate`);
  await check("/collaborate");

  console.log(`Checking ${baseUrl}/login`);
  await check("/login");

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
