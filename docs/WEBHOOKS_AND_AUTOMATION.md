# ARTEMIS Webhooks and Automation

## Allowed webhook uses

- deployment trigger
- Resend email events
- Lemon Squeezy subscription events later
- domain verification jobs
- opportunity source refresh jobs
- radar refresh jobs
- backup status
- health monitoring

## Rules

- validate signatures when provider supports it
- do not perform destructive actions by default
- log events safely
- do not store secrets in logs
- keep webhooks disabled unless configured

## Future webhooks

- `/api/webhooks/resend`
- `/api/webhooks/lemonsqueezy`
- `/api/webhooks/deploy`

## Background jobs

Use BullMQ + Redis for:

- domain checks
- file processing
- opportunity refresh
- radar digest generation
- thumbnail generation
- assistant indexing
