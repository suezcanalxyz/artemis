# ARTEMIS Deployment Stack

## Preferred v1 deployment

ARTEMIS should deploy on a VPS using Docker Compose or Coolify.

Preferred stack:

- Aruba VPS
- Docker Compose
- Coolify if useful as deployment manager
- Caddy or Traefik reverse proxy
- PostgreSQL 16
- Redis
- persistent uploads volume
- optional Ollama service
- Resend for email later
- UptimeRobot for monitoring
- Sentry for error tracking
- Lemon Squeezy later

## Why self-hosted

ARTEMIS handles professional materials from contemporary art users:

- portfolios
- documents
- private dossiers
- application drafts
- technical riders
- collection records
- strategy notes
- source-grounded outputs

A self-hosted stack keeps control over data, files and deployment.

## Cargo-like public publishing

ARTEMIS should feel simple for public publishing:

1. choose template
2. publish on Artemis subdomain
3. optionally connect custom domain
4. automatic SSL
5. copy public link

The infrastructure can use Caddy/Traefik, but the user experience should remain simple.

## Production commands

```bash
cp .env.production.example .env.production
npm run deploy:check-env
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
npm run migrate
npm run deploy:smoke
```

If port `3000` is already occupied on the host, set `HOST_PORT` before running
the production compose stack, for example `HOST_PORT=3010`.

## Health checks

- `/api/health`
- `/api/ready`

Readiness should check database and Redis if enabled.

## Backups

Use `pg_dump` from the database container or host.

Backup:

```bash
npm run db:backup
```

Restore:

```bash
npm run db:restore -- ./backups/artemis-latest.sql
```
