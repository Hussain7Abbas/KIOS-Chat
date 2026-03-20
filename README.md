# KIOS Chat

Full-stack AI chat app: **Next.js 16** (App Router), **TypeScript**, **Prisma**, **PostgreSQL**, **Better Auth**, **OpenRouter**, **Stripe**, and **ImageKit**. Optional **sub-agents** run tool calls through **BullMQ** + **Redis** with a separate worker process.

## Features

- **Authentication**: Email/password, Google, and Facebook OAuth (Better Auth).
- **AI chat**: Streaming completions via OpenRouter; admin-defined system prompt.
- **Sub-agents** (optional): Admins configure named tools (instructions, model, typed parameters). The main model can call them; each run is queued, stored as a **sub-thread**, and shown in a toggleable right sidebar.
- **File attachments**: Uploads via **ImageKit** (e.g. `.txt`; PDF flow documented in-app).
- **Subscriptions**: Stripe one-time purchases to add thread quota.
- **Admin dashboard**: Usage, **main agent instructions**, **sub-agent CRUD**, users.
- **UI**: Tailwind CSS, shadcn-style components, Framer Motion.

## Stack

| Area | Technology |
|------|------------|
| Runtime / package manager | [Bun](https://bun.sh) |
| Framework | Next.js 16, React 19 |
| Database | PostgreSQL, Prisma (`src/prisma/schema.prisma`) |
| Auth | Better Auth |
| LLM | OpenRouter (OpenAI-compatible client) |
| Files | ImageKit |
| Payments | Stripe |
| Sub-agent jobs | BullMQ + Redis (`bun run worker`) |
| Production processes | [PM2](https://pm2.keymetrics.io/) — `ecosystem.config.cjs` (web + worker) |

## Architecture (high level)

```
                         +------------------+
                         |   Client (Web)   |
                         +--------+---------+
                                  |
                                  v
                         +------------------+
                         |  Next.js App     |
                         |  API + RSC       |
                         +--------+---------+
                                  |
     +----------------------------+----------------------------+
     |                            |                            |
     v                            v                            v
+------------+           +---------------+            +---------------+
| Better Auth|           | OpenRouter    |            | Stripe API    |
| + Postgres |           | (streaming)   |            | + webhooks    |
+------------+           +---------------+            +---------------+
     |                            |
     |                    +-------+--------+
     |                    |                |
     v                    v                v
+------------------+   +---------+   +-------------+
| PostgreSQL       |   | Redis   |   | ImageKit    |
| (Prisma)         |   | BullMQ  |   | uploads     |
+------------------+   +----+----+   +-------------+
                             |
                             v
                    +------------------+
                    | subagent-worker  |
                    | (OpenRouter)     |
                    +------------------+
```

## Prerequisites

- **Bun** (recommended) — install from [bun.sh](https://bun.sh)
- **Docker** (optional but recommended) — Postgres + Redis via `docker compose`
- **PostgreSQL** — local, Docker, or hosted (`DATABASE_URL`)
- **OpenRouter** API key
- **Stripe** keys + webhook secret (for purchases)
- **ImageKit** keys (uploads)
- **Redis** — required if you use sub-agents (`REDIS_URL` in `.env`)
- **OAuth** (optional) — Google and/or Facebook app credentials

## Quick start

```bash
git clone <repo-url>
cd KIOS-Chat

# One-shot: install, copy .env if missing, prisma generate
make setup

# Edit .env — see .env.example (DATABASE_URL, REDIS_*, auth, Stripe, ImageKit, OpenRouter, …)

# Start Postgres + Redis
make docker-up

# Apply migrations (dev)
make db-migrate

# Optional: seed default users (see below)
make db-seed
```

Run the app (two terminals if you use sub-agents):

```bash
# Terminal 1
make dev

# Terminal 2 — only needed when sub-agents are configured and Redis is running
make worker
```

Open [http://localhost:3000](http://localhost:3000).

### Makefile

Run `make help` for all targets. Common ones:

| Target | Purpose |
|--------|---------|
| `make setup` | `bun install`, `make env`, `prisma generate` |
| `make docker-up` / `make docker-down` | Start/stop Postgres + Redis |
| `make db-migrate` | `prisma migrate dev` |
| `make db-deploy` | `prisma migrate deploy` |
| `make db-push` | `prisma db push` (dev schema sync) |
| `make db-seed` | Seed script |
| `make db-studio` | Prisma Studio |
| `make dev` | Next.js dev server |
| `make worker` | BullMQ sub-agent worker |
| `make build` / `make start` | Production build / start |
| `make pm2-deploy` / `make pm2-start` | PM2: build + start/reload, or start ecosystem only |
| `make pm2-restart` / `make pm2-reload` / `make pm2-stop` / `make pm2-delete` | PM2 lifecycle |
| `make pm2-logs` / `make pm2-status` | PM2 logs / process list |
| `make typecheck` / `make lint` | Quality checks |

Equivalent without Make: `bun install`, `bunx prisma …`, `bun run dev`, `bun run worker`, etc.

## Production with PM2

[`ecosystem.config.cjs`](ecosystem.config.cjs) defines two apps: **`kios-chat`** (`bun run start`, Next.js) and **`kios-chat-worker`** (`bun run src/workers/subagent-worker.ts`, BullMQ). Use this on a server instead of separate shells for `make start` and `make worker`.

1. Set environment variables on the host (or inject via your platform). Next and the worker read the same `.env` patterns as local development.
2. Run migrations: `make db-deploy` (or `bunx prisma migrate deploy`).
3. Build, then start PM2:

```bash
make pm2-deploy       # bun run build + pm2 startOrReload ecosystem.config.cjs
# or, manually:
# bun run build && pm2 start ecosystem.config.cjs

pm2 save              # optional: persist the process list
pm2 startup           # optional: resurrect after reboot (follow pm2’s printed instructions)
```

Other targets: `make pm2-start`, `make pm2-restart`, `make pm2-reload`, `make pm2-stop`, `make pm2-delete`, `make pm2-logs`, `make pm2-status` (see `make help`).

`bun` must be on `PATH` for the user running PM2. To run more BullMQ consumers, increase `instances` on `kios-chat-worker` in the ecosystem file.

## Environment variables

Copy and edit from the example file:

```bash
cp .env.example .env   # or: make env
```

Required values are validated at runtime (see `src/lib/env.ts`). At minimum you need database, auth secret/URL, app URL, OpenRouter, Stripe, ImageKit, and OAuth client IDs if you use those providers.

**Sub-agents / queue**

- `REDIS_URL` — e.g. `redis://:password@localhost:6379` (must match `REDIS_PASSWORD` if you use Docker Redis)
- `REDIS_PASSWORD` — used by `docker-compose.yml` for the Redis container

**Docker Compose**

- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` — must align with `DATABASE_URL` when using the bundled Postgres service.
- If port `5432` is already taken, set `POSTGRES_PORT` (e.g. `5433`) and adjust `DATABASE_URL` accordingly.

## Database & seed

Prisma schema: `src/prisma/schema.prisma`.

After migrations, optional seed creates:

| Role | Email | Password |
|------|--------|----------|
| Admin | `root@email.com` | `12345678` |
| User | `user@email.com` | `12345678` |

```bash
make db-seed
```

## Sub-agents

1. Ensure **Redis** is running and **`REDIS_URL`** is set.
2. Run **`make worker`** alongside **`make dev`** (local). In production, run the worker via PM2 — see [Production with PM2](#production-with-pm2).
3. In **Dashboard → Agent settings**, define sub-agents (tool name, instructions, model, output format, parameters).
4. During chat, the main model may emit **tool calls**; the API creates **sub-thread** rows, enqueues jobs, waits for the worker, streams **SSE** updates (`subthread`, `threadStatus`), and continues the reply.

Thread statuses: `IDLE`, `PROCESSING`, `WAITING` (while a sub-agent job is in flight).

## Stripe webhooks (local)

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Put the printed signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

## Business logic (short)

### Thread quota

New users get a starting thread allowance. Creating a thread decrements it. At zero, new threads are blocked until quota is purchased via Stripe; a verified webhook increments `threadsRemaining`.

### Main agent & sub-agents

Admins set the **global system prompt** (main agent). Sub-agents are separate configs exposed to the main model as **function tools**; they do not see the main thread history—only the JSON arguments passed into each invocation.

## Scripts (`package.json`)

| Script | Command |
|--------|---------|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `worker` | BullMQ sub-agent worker |

## Next.js note

This repo targets a **current Next.js 16** toolchain; check `node_modules/next/dist/docs/` for framework-specific APIs if you extend routing or server features.

