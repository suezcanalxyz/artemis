import { logger } from "../lib/logger.js";
import { config } from "../config.js";

type Template =
  | "domain-started"
  | "domain-verified"
  | "domain-failed"
  | "domain-degraded";

const subjects: Record<Template, string> = {
  "domain-started": "Artemis domain verification started",
  "domain-verified": "Artemis domain verified",
  "domain-failed": "Artemis domain verification still pending",
  "domain-degraded": "Artemis domain health degraded"
};

export async function sendTemplateEmail(
  to: string,
  template: Template,
  lines: string[]
) {
  const payload = {
    from: config.EMAIL_FROM,
    to: [to],
    subject: subjects[template],
    text: lines.join("\n")
  };

  if (
    config.RESEND_API_KEY === "resend-placeholder" ||
    config.NODE_ENV === "test"
  ) {
    logger.info({ to, template }, "Email delivery skipped");
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.RESEND_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}
