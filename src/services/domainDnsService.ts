import dns from "node:dns/promises";

type VerificationDomain = {
  host: string;
  verification_method: "txt" | "cname";
  verification_token: string;
  verification_target: string | null;
};

let txtResolver = dns.resolveTxt;
let cnameResolver = dns.resolveCname;

export function setDomainDnsResolvers(testing?: {
  resolveTxt?: typeof dns.resolveTxt;
  resolveCname?: typeof dns.resolveCname;
}) {
  txtResolver = testing?.resolveTxt ?? dns.resolveTxt;
  cnameResolver = testing?.resolveCname ?? dns.resolveCname;
}

export function buildTxtRecordName(host: string) {
  return `_artemis-verify.${host}`;
}

export async function checkDomainVerification(domain: VerificationDomain) {
  try {
    if (domain.verification_method === "txt") {
      const records = await txtResolver(buildTxtRecordName(domain.host));
      const values = records.flat().map((entry) => entry.trim());
      return {
        ok: values.includes(domain.verification_token),
        detail: values.join(", ") || null
      };
    }

    const records = await cnameResolver(domain.host);
    const normalized = records.map((entry) =>
      entry.replace(/\.$/, "").toLowerCase()
    );
    const expected = (domain.verification_target ?? "")
      .replace(/\.$/, "")
      .toLowerCase();
    return {
      ok: normalized.includes(expected),
      detail: normalized.join(", ") || null
    };
  } catch (error) {
    return {
      ok: false,
      detail: error instanceof Error ? error.message : "DNS lookup failed"
    };
  }
}
