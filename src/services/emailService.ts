import { logger } from "../lib/logger.js";
import { config } from "../config.js";

type Template =
  | "domain-started"
  | "domain-verified"
  | "domain-failed"
  | "domain-degraded";

type LandingTemplate = "waitlist-joined" | "collaborator-received";

const subjects: Record<Template, string> = {
  "domain-started": "Artemis domain verification started",
  "domain-verified": "Artemis domain verified",
  "domain-failed": "Artemis domain verification still pending",
  "domain-degraded": "Artemis domain health degraded"
};

const landingSubjects: Record<LandingTemplate, string> = {
  "waitlist-joined": "You're on the Artemis waitlist",
  "collaborator-received": "We received your collaboration request - Artemis"
};

const landingBodies: Record<LandingTemplate, string[]> = {
  "waitlist-joined": [
    "Hello,",
    "",
    "Thank you for joining the Artemis waitlist.",
    "",
    "We are opening the beta carefully, one invitation at a time. When a place is ready, we will let you know by email.",
    "",
    "If you want to share a little about your practice, feel free to reply. We are always glad to hear from artists directly.",
    "",
    "Warmly,",
    "The Artemis team"
  ],
  "collaborator-received": [
    "Hello!",
    "",
    "Thank you for reaching out about collaborating with Artemis.",
    "",
    "We received your note about helping train the model and we are reviewing it carefully.",
    "",
    "We will follow up as soon as we can with next steps or a request for more detail.",
    "",
    "Thank you again for taking the time to write to us.",
    "",
    "Warmly,",
    "The Artemis team"
  ]
};

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  templateName: string
) {
  const payload = { from: config.EMAIL_FROM, to: [to], subject, text };

  if (
    config.RESEND_API_KEY === "resend-placeholder" ||
    config.NODE_ENV === "test"
  ) {
    logger.info({ to, template: templateName }, "Email delivery skipped");
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

export async function sendTemplateEmail(
  to: string,
  template: Template,
  lines: string[]
) {
  await sendEmail(to, subjects[template], lines.join("\n"), template);
}

export async function sendLandingEmail(to: string, template: LandingTemplate) {
  await sendEmail(
    to,
    landingSubjects[template],
    landingBodies[template].join("\n"),
    template
  );
}
