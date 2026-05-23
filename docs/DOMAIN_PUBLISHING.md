# ARTEMIS Domain Publishing

## Goal

Make publishing feel as simple as Cargo, but for contemporary art professional profiles, dossiers, archives and presentations.

## Domain states

- `artemis.network`: marketing or root public site
- `app.artemis.network`: control plane
- `{slug}.artemis.network`: Artemis-hosted public profile/site
- custom domain: user-owned domain

## User flow

1. User chooses public profile slug.
2. Artemis creates `{slug}.artemis.network`.
3. User can publish profile, dossiers and viewing rooms.
4. User can optionally connect a custom domain.
5. Artemis gives DNS instructions.
6. User adds TXT/CNAME records.
7. Artemis verifies domain.
8. HTTPS is automatic.
9. Public site is live.

## DNS verification

Use:

- TXT record for verification
- CNAME for subdomain routing where applicable

## Public publishing

Public pages must never leak:

- private documents
- draft dossiers
- unpublished artworks
- internal IDs where avoidable
- private notes
- assistant context
- radar items marked private

## Unknown domains

Unknown hosts should return a helpful 404, not a 500.
