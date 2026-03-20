# KIOS Chat — local setup & run (uses bun)
# Run `make help` for targets.

SHELL := /bin/bash

.PHONY: help install setup env docker-up docker-down docker-logs redis-up redis-down redis-logs \
	db-generate db-migrate db-deploy db-migrate-deploy db-reset db-push db-seed db-studio \
	dev worker build start lint typecheck clean

help:
	@echo "KIOS Chat — common commands"
	@echo ""
	@echo "  Setup"
	@echo "    make setup        Install deps + prisma generate (run once / after clone)"
	@echo "    make install      bun install only"
	@echo "    make env          Create .env from .env.example if missing"
	@echo ""
	@echo "  Infrastructure (docker compose — Postgres + Redis; needs .env)"
	@echo "    make docker-up    Start Postgres + Redis"
	@echo "    make docker-down  Stop all compose services"
	@echo "    make docker-logs  Tail Postgres + Redis logs"
	@echo "    make redis-up     Alias for docker-up"
	@echo "    make redis-down   Alias for docker-down"
	@echo "    make redis-logs   Tail Redis only"
	@echo ""
	@echo "  Database (PostgreSQL must be running; DATABASE_URL in .env)"
	@echo "    make db-generate       prisma generate"
	@echo "    make db-migrate        prisma migrate dev (interactive name)"
	@echo "    make db-deploy         prisma migrate deploy (CI / prod-like)"
	@echo "    make db-migrate-deploy same as db-deploy"
	@echo "    make db-reset          prisma migrate reset (drops DB, reapplies migrations, seed)"
	@echo "    make db-push           prisma db push (dev schema sync, no migration files)"
	@echo "    make db-seed           prisma db seed"
	@echo "    make db-studio         open Prisma Studio"
	@echo ""
	@echo "  App"
	@echo "    make dev          Next.js dev server (terminal 1)"
	@echo "    make worker       BullMQ sub-agent worker (terminal 2; needs Redis)"
	@echo "    make build        next build"
	@echo "    make start        next start (after build)"
	@echo ""
	@echo "  Quality"
	@echo "    make lint         eslint"
	@echo "    make typecheck    tsc --noEmit"

install:
	bun install

env:
	@if [[ ! -f .env ]]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example — edit secrets and URLs before running."; \
	else \
		echo ".env already exists (left unchanged)."; \
	fi

db-generate:
	bunx prisma generate

db-migrate:
	bunx prisma migrate dev

db-deploy db-migrate-deploy:
	bunx prisma migrate deploy

db-reset:
	bunx prisma migrate reset

db-push:
	bunx prisma db push

db-seed:
	bunx prisma db seed

db-studio:
	bunx prisma studio

setup: install env db-generate
	@echo ""
	@echo "Next steps:"
	@echo "  1. Edit .env (DATABASE_URL, REDIS_URL, REDIS_PASSWORD, auth keys, …)"
	@echo "  2. make docker-up  (Postgres + Redis via Docker)"
	@echo "  3. make db-migrate or make db-push"
	@echo "  4. make dev        (and in another terminal: make worker)"

docker-up:
	@test -f .env || (echo "Missing .env — run: make env" && exit 1)
	docker compose --env-file .env up -d
	@echo "Postgres + Redis are up. Check DATABASE_URL and REDIS_URL match .env (see .env.example)."

docker-down:
	@test -f .env || (echo "Missing .env — run: make env" && exit 1)
	docker compose --env-file .env down

docker-logs:
	@test -f .env || (echo "Missing .env — run: make env" && exit 1)
	docker compose --env-file .env logs -f

redis-up: docker-up

redis-down: docker-down

redis-logs:
	@test -f .env || (echo "Missing .env — run: make env" && exit 1)
	docker compose --env-file .env logs -f redis

dev:
	bun run dev

worker:
	bun run worker

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

typecheck:
	bun run typecheck

clean:
	rm -rf .next node_modules/.cache
