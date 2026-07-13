import { describe, it, expect, beforeAll, afterAll } from 'bun:test'

// ต้อง set ก่อน import app เพื่อให้ DB ใช้ in-memory
process.env.DB_PATH = ':memory:'

import { app } from '../src/index'

// helper สร้าง request
function req(method: string, path: string, body?: unknown): Request {
  const opts: RequestInit = { method }
  if (body !== undefined) {
    opts.body = JSON.stringify(body)
    opts.headers = { 'Content-Type': 'application/json' }
  }
  return new Request(`http://localhost${path}`, opts)
}

// feature ที่ POST แล้วเก็บ id ไว้ใช้ระหว่าง test
let createdId: string

describe('Spatial Data Platform API', () => {
  afterAll(() => {
    app.stop()
  })

  // 1. Health check
  it('GET /api/health → 200 status ok', async () => {
    const res = await app.handle(req('GET', '/api/health'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
  })

  // 2. GET /api/features → FeatureCollection
  it('GET /api/features → 200 FeatureCollection', async () => {
    const res = await app.handle(req('GET', '/api/features'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.type).toBe('FeatureCollection')
  })

  // 3. GET /api/features → features is array
  it('GET /api/features → features is array', async () => {
    const res = await app.handle(req('GET', '/api/features'))
    const body = await res.json()
    expect(Array.isArray(body.features)).toBe(true)
  })

  // 4. POST valid feature → 201 Feature
  it('POST /api/features valid → 201 with id and type Feature', async () => {
    const res = await app.handle(req('POST', '/api/features', {
      geometry: { type: 'Point', coordinates: [100.5, 13.7] },
      properties: { name: 'Test Location' },
    }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.type).toBe('Feature')
    expect(typeof body.id).toBe('string')
    expect(body.properties.name).toBe('Test Location')
    createdId = body.id
  })

  // 5. POST missing name → 400
  it('POST /api/features missing name → 400 with error', async () => {
    const res = await app.handle(req('POST', '/api/features', {
      geometry: { type: 'Point', coordinates: [100.5, 13.7] },
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  // 6. POST invalid coordinates (lon > 180) → 400
  it('POST /api/features invalid coordinates → 400', async () => {
    const res = await app.handle(req('POST', '/api/features', {
      geometry: { type: 'Point', coordinates: [200, 13.7] },
      properties: { name: 'Bad Coords' },
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  // 7. GET /api/features/:id หลัง POST → 200 correct id
  it('GET /api/features/:id → 200 correct feature', async () => {
    const res = await app.handle(req('GET', `/api/features/${createdId}`))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(createdId)
    expect(body.type).toBe('Feature')
  })

  // 8. GET /api/features/nonexistent → 404
  it('GET /api/features/nonexistent → 404', async () => {
    const res = await app.handle(req('GET', '/api/features/does-not-exist-99999'))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })

  // 9. PUT /api/features/:id → 200 updated name
  it('PUT /api/features/:id → 200 updated name', async () => {
    const res = await app.handle(req('PUT', `/api/features/${createdId}`, {
      properties: { name: 'Updated Location' },
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.properties.name).toBe('Updated Location')
  })

  // 10. PUT nonexistent → 404
  it('PUT /api/features/nonexistent → 404', async () => {
    const res = await app.handle(req('PUT', '/api/features/does-not-exist-99999', {
      properties: { name: 'Ghost' },
    }))
    expect(res.status).toBe(404)
  })

  // 11. DELETE /api/features/:id → 204
  it('DELETE /api/features/:id → 204', async () => {
    const res = await app.handle(req('DELETE', `/api/features/${createdId}`))
    expect(res.status).toBe(204)
  })

  // 12. DELETE nonexistent → 404
  it('DELETE /api/features/nonexistent → 404', async () => {
    const res = await app.handle(req('DELETE', '/api/features/does-not-exist-99999'))
    expect(res.status).toBe(404)
  })
})
