<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### Overview

KIOS Chat is a full-stack AI chat app (Next.js 16, Bun, Prisma, PostgreSQL, Redis, OpenRouter, Stripe, ImageKit, BullMQ). See `README.md` for full architecture and Makefile targets.

### Running services

- **Docker (Postgres + Redis):** `sudo dockerd` must be running first (the VM does not auto-start it). Then `docker compose --env-file .env up -d` from `/workspace`. The `.env` file needs `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_PASSWORD` for Docker Compose; the actual `DATABASE_URL` and `REDIS_URL` are injected as environment secrets.
- **Next.js dev server:** `bun run dev` (port 3000). Uses `--webpack` flag by default.
- **BullMQ worker** (optional, for sub-agents): `bun run worker` in a separate terminal.

### Key commands

| Task | Command |
|------|---------|
| Install deps | `bun install` (runs `prisma generate` via postinstall) |
| Lint | `bun run lint` |
| Typecheck | `bun run typecheck` |
| Migrate DB | `bunx prisma migrate deploy` |
| Seed DB | `bunx prisma db seed` |
| Dev server | `bun run dev` |
| All Makefile targets | `make help` |

### Gotchas

- There is no `.env.example` in the repo. The required env vars are defined in `src/lib/env.ts` (Zod schema). All are validated at startup — the app crashes if any are missing.
- The `DATABASE_URL` injected via secrets points to a Neon cloud database (not the local Docker Postgres). Migrations and seed run against Neon.
- Docker requires `sudo dockerd` to start the daemon, then `sudo chmod 666 /var/run/docker.sock` for non-root access. Docker uses `fuse-overlayfs` storage driver and `iptables-legacy`.
- Seeded accounts: Admin `root@email.com` / `12345678`, User `user@email.com` / `12345678`.
- Prisma schema is at `src/prisma/schema.prisma`, not the default location.
