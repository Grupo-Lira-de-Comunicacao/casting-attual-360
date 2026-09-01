# Casting 360 — Promotion, Rollback and Break Glass

## Purpose

Casting 360 is the pilot for the ATLAS Software Promotion Layer. GitHub is the source of truth and every production candidate is identified by an immutable Git SHA.

## Normal path

`GitHub candidate -> CI -> Vercel Preview -> technical validation -> promotion eligibility -> production -> read-back -> ACTIVE`

A human approval never overrides a failed technical gate. Human decisions are reserved for business scope, cost, destructive changes and emergency break-glass actions.

## Promotion identity

The promoted unit is the exact candidate SHA that passed the technical gate. Rebuilding a different commit, promoting an unverified branch head, or changing the candidate after validation invalidates promotion eligibility.

## Database migrations

Application rollback and database recovery are different operations.

- Application rollback: return traffic/application to a previously verified deployment.
- Database forward fix: preferred when the migration already changed durable data and a safe forward repair exists.
- Database restore: only from a verified backup/restore point with explicit recovery validation.

Destructive migration patterns are blocked by the Promotion Gate unless the migration explicitly records both:

- `ATLAS-MIGRATION: destructive-reviewed`
- `ATLAS-MIGRATION: backup-verified`

These markers are evidence requirements, not permission to bypass ATLAS N4/N4_ROOT governance.

## Break glass

Break glass is not an alternate deployment path. It is an N4_ROOT emergency exception and must be:

1. bound to a declared incident and resource scope;
2. time limited;
3. executed with strong identity and an explicit reason;
4. logged in immutable audit evidence;
5. reconciled against GitHub after the incident;
6. followed by restoration of the normal promotion path.

A break-glass credential or route must never become a permanent silent bypass.

## Supersession and cleanup

After the new promotion path is implemented, tested in preview, validated in production and observed successfully, obsolete workflows, duplicate deployment paths, temporary branches, superseded scripts and stale configuration are marked `SUPERSEDED` and removed after the short safety-retention window. Minimum audit evidence is retained.

## Current rollout state

Phase 1 is shadow-only. The Promotion Gate validates candidate identity, code quality, build and migration safety but does not deploy production. Vercel's current Git production deployment remains authoritative until the shadow gate is proven and the authority transfer is explicitly activated.
