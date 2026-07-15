# Spatial Data Platform

Mini Spatial Data Platform — แบบทดสอบ Software Engineer, i-Bitz

## Live Demo

| Service | URL |
|---------|-----|
| Frontend | https://spatial-location.vercel.app |
| Backend API | https://spatial-location-production.up.railway.app |
| Swagger Docs | https://spatial-location-production.up.railway.app/swagger |

---

## Features

- **CRUD** — Add, Edit, Delete spatial features (GeoJSON Point)
- **Map** — MapLibre GL JS + OpenFreeMap tiles, click map to pre-fill coordinates
- **Table** — MUI DataGrid with pagination and client-side search/filter
- **Logging** — Request log table with response time, status, method (`GET /api/logs`)
- **Docker** — Docker Compose for full local stack
- **Deploy** — Railway (backend) + Vercel (frontend)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Backend | Elysia + SQLite (`bun:sqlite`) |
| Validation | Zod |
| API Docs | `@elysiajs/swagger` |
| Frontend | React 19 + Vite + TypeScript |
| UI | MUI v6 + x-data-grid v7 |
| Map | MapLibre GL JS + OpenFreeMap |
| State | TanStack Query |

---

## Local Development

### Backend

```bash
cd backend
bun install
bun run src/index.ts
# http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Environment Variables

**backend/.env**
```
PORT=3000
DB_PATH=data.db
```

**frontend/.env**
```
VITE_API_URL=http://localhost:3000
```

---

## Docker Compose (Full Stack)

```bash
docker compose up --build
# Frontend → http://localhost
# Backend  → http://localhost:3000
```

---

## API Reference

Full interactive docs: `GET /swagger`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/features` | List all features (GeoJSON FeatureCollection) |
| GET | `/api/features/:id` | Get feature by ID |
| POST | `/api/features` | Create feature |
| PUT | `/api/features/:id` | Update feature |
| DELETE | `/api/features/:id` | Delete feature |
| GET | `/api/logs` | Request logs (`?limit=50&from=ISO&to=ISO`) |

### POST /api/features — Request Body

```json
{
  "geometry": {
    "type": "Point",
    "coordinates": [100.4913, 13.7500]
  },
  "properties": {
    "name": "วัดพระแก้ว"
  }
}
```

---

## Postman Collection

Import `spatial-data-platform.postman_collection.json` — includes all endpoints with `{{baseUrl}}` variable pre-set to the Railway URL.
