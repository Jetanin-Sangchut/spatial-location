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

### Core
- **CRUD** — Create, Read, Update, Delete spatial features via RESTful API
- **GeoJSON** — Request/Response เป็น GeoJSON Feature / FeatureCollection (spec-compliant)
- **Multi-Geometry** — รองรับ Point, LineString, และ Polygon
- **Map** — MapLibre GL JS + OpenFreeMap tiles แสดงผลทุก geometry type
- **Table** — MUI DataGrid พร้อม pagination
- **Postman Collection** — ครบทุก endpoint พร้อม body ตัวอย่างทุก geometry type

### Bonus & Creativity
- **Map-click-to-add** — click บน map เพื่อเปิด Add dialog พร้อม coordinates pre-fill
- **Edit feature** — แก้ไขชื่อ, พิกัด, และประเภทสถานที่
- **Category system** — แบ่งประเภทสถานที่ (มหาวิทยาลัย, วัด, สนามบิน ฯลฯ) พร้อม dropdown filter
- **Geometry type filter** — กรอง Point / LineString / Polygon แยกกันบนแผนที่และตาราง
- **Search** — ค้นหาด้วยชื่อ, Longitude, หรือ Latitude (client-side)
- **Category color map** — แต่ละประเภทแสดงสีต่างกันบนแผนที่ (MapLibre data-driven expression)
- **Fly-to on row click** — click แถวใน DataGrid → แผนที่ animate ไปยัง feature นั้น
- **Export GeoJSON** — ดาวน์โหลด features ที่กำลังแสดงอยู่ (ตาม filter ปัจจุบัน) เป็น `.geojson`
- **Request logging** — บันทึกทุก request พร้อม response time, status (`GET /api/logs`)
- **Docker Compose** — `docker compose up --build` รัน full stack ได้ทันที
- **Dual deploy** — Railway (backend) + Vercel (frontend) live พร้อมกัน

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Runtime | Bun |
| Backend | Elysia + `@elysiajs/swagger` |
| Database | SQLite (`bun:sqlite`) — zero dependency |
| Validation | Zod (discriminated union per geometry type) |
| Frontend | React 19 + Vite + TypeScript |
| UI | MUI v6 + x-data-grid v7 |
| Map | MapLibre GL JS + OpenFreeMap |
| State | TanStack Query |
| Alerts | SweetAlert2 |

---

## Local Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Node.js >= 18 (for frontend only)

### Backend

```bash
cd backend
bun install
bun dev
# http://localhost:3000
# Swagger: http://localhost:3000/swagger
```

### Frontend

```bash
cd frontend
bun install   # or: npm install
bun dev       # or: npm run dev
# http://localhost:5173
```

### Environment Variables

**backend/.env**
```
PORT=3000
DB_PATH=data.db       # ใช้ :memory: สำหรับ ephemeral (Railway)
NODE_ENV=development
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

| Method | Path | Description | Status |
|--------|------|-------------|--------|
| GET | `/api/health` | Health check | 200 |
| GET | `/api/features` | List all (GeoJSON FeatureCollection) | 200 |
| GET | `/api/features/:id` | Get by ID | 200 / 404 |
| POST | `/api/features` | Create feature | 201 / 400 |
| PUT | `/api/features/:id` | Partial update | 200 / 400 / 404 |
| DELETE | `/api/features/:id` | Delete | 204 / 404 |
| GET | `/api/logs` | Request logs (`?limit=50&from=ISO&to=ISO`) | 200 |

### POST /api/features — Request Body

**Point**
```json
{
  "geometry": { "type": "Point", "coordinates": [100.4913, 13.7500] },
  "properties": { "name": "วัดพระแก้ว", "category": "วัด" }
}
```

**LineString**
```json
{
  "geometry": {
    "type": "LineString",
    "coordinates": [[100.522, 13.721], [100.528, 13.724], [100.534, 13.726]]
  },
  "properties": { "name": "ถนนสีลม", "category": "ทั่วไป" }
}
```

**Polygon**
```json
{
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[100.540, 13.729], [100.545, 13.729], [100.545, 13.733], [100.540, 13.733], [100.540, 13.729]]]
  },
  "properties": { "name": "สวนลุมพินี", "category": "อุทยาน" }
}
```

---

## Postman Collection

Import `spatial-data-platform.postman_collection.json` — ครบทุก endpoint พร้อม `{{baseUrl}}` ตั้งค่าไว้ที่ Railway URL

---

## สิ่งที่ทำได้

- [x] CRUD API ครบ (GET, POST, PUT, DELETE) พร้อม error handling (400, 404, 500)
- [x] GeoJSON FeatureCollection format
- [x] รองรับ Geometry 3 ประเภท: Point, LineString, Polygon
- [x] Zod validation แบบ discriminated union ตาม geometry type
- [x] Swagger UI auto-generated
- [x] Request logging พร้อม response time measurement
- [x] Interactive map พร้อม popup และ click-to-add
- [x] DataGrid พร้อม pagination, search, category filter, geometry filter
- [x] Export GeoJSON (ตาม filter ปัจจุบัน)
- [x] Docker Compose
- [x] Deploy บน Railway + Vercel

## สิ่งที่ยังไม่ได้ทำ

- UI สำหรับวาด LineString / Polygon บนแผนที่ (ใช้ Postman สาธิต API แทน)
- Category management UI (จัดการประเภทผ่าน UI — ปัจจุบัน category เป็น predefined list)
- Authentication / Authorization
- Unit tests ฝั่ง frontend
