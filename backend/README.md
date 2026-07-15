# Backend — Spatial Data Platform

Bun + Elysia REST API with SQLite database.

## Setup

```bash
bun install
```

## Run

```bash
bun run src/index.ts
# http://localhost:3000
```

## Environment Variables

```
PORT=3000          # default: 3000
DB_PATH=data.db    # default: data.db — use :memory: for ephemeral
NODE_ENV=development
```

## API Docs

Swagger UI available at `/swagger` when running.

## Docker

```bash
docker build -t spatial-backend .
docker run -p 3000:3000 -e DB_PATH=:memory: spatial-backend
```
