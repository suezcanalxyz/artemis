import { sql } from "../lib/db.js";

let healthFetch: typeof fetch = fetch;

type DomainRow = { id: string; host: string };

export function setDomainHealthFetch(mockFetch?: typeof fetch) {
  healthFetch = mockFetch ?? fetch;
}

export async function runDomainHealthCheck(domainId: string) {
  const [domain] = await sql<DomainRow[]>`
    select id, host from domains where id = ${domainId} and is_verified = true
  `;
  if (!domain) return null;

  let sslOk = false;
  let httpStatus: number | null = null;
  let error: string | null = null;

  try {
    const httpsResponse = await healthFetch(`https://${domain.host}`, {
      method: "GET",
      redirect: "manual"
    });
    sslOk = true;
    httpStatus = httpsResponse.status;
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "HTTPS request failed";
    try {
      const httpResponse = await healthFetch(`http://${domain.host}`, {
        method: "GET",
        redirect: "manual"
      });
      httpStatus = httpResponse.status;
    } catch {
      httpStatus = null;
    }
  }

  const [check] = await sql`
    insert into domain_health_checks (domain_id, dns_ok, ssl_ok, http_status, error)
    values (${domain.id}, true, ${sslOk}, ${httpStatus}, ${error})
    returning *
  `;
  await sql`
    update domains
    set last_health_check_at = now(), last_error = ${error}
    where id = ${domain.id}
  `;
  return check;
}
