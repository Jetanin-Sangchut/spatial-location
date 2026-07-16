import Elysia from 'elysia'
import { randomUUID } from 'crypto'
import { db } from '../db/client'
import { CreateFeatureSchema, UpdateFeatureSchema } from '../schemas/feature'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

// แปลง DB row เป็น GeoJSON Feature — return null ถ้าข้อมูล JSON เสียหาย (ไม่ทำให้ list ทั้งหมด fail)
function toFeature(row: Record<string, unknown>): GeoJSONFeature | null {
  try {
    const coordinates = JSON.parse(row.coordinates as string) as [number, number]
    const extraProps = row.properties
      ? (JSON.parse(row.properties as string) as Record<string, unknown>)
      : {}
    return {
      id: row.id as string,
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: { name: row.name as string, category: (row.category as string | undefined) ?? 'ทั่วไป', ...extraProps },
    }
  } catch (err) {
    console.error(`[features] toFeature corrupt row id=${row.id}:`, err)
    return null
  }
}

function notFound(set: { status?: number | string }) {
  set.status = 404
  return { error: 'ไม่พบสถานที่', status: 404 }
}

function serverError(set: { status?: number | string }, msg = 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์') {
  set.status = 500
  return { error: msg, status: 500 }
}

export const featuresRoutes = new Elysia({ prefix: '/api/features' })

  // GET /api/features
  .get('/', ({ set }) => {
    try {
      const rows = db.query<Record<string, unknown>, []>('SELECT * FROM features ORDER BY created_at DESC').all()
      const features = rows.map(toFeature).filter((f): f is GeoJSONFeature => f !== null)
      const collection: GeoJSONFeatureCollection = { type: 'FeatureCollection', features }
      return collection
    } catch (err) {
      console.error('[features] GET / failed:', err)
      return serverError(set)
    }
  })

  // GET /api/features/:id
  .get('/:id', ({ params, set }) => {
    try {
      const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
      if (!row) return notFound(set)
      return toFeature(row)
    } catch (err) {
      console.error(`[features] GET /${params.id} failed:`, err)
      return serverError(set)
    }
  })

  // POST /api/features
  .post('/', ({ body, set }) => {
    const parsed = CreateFeatureSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', status: 400 }
    }

    const { geometry, properties } = parsed.data
    const { name, category = 'ทั่วไป', ...extraProps } = properties
    const propsJson = Object.keys(extraProps).length > 0 ? JSON.stringify(extraProps) : null
    const id = randomUUID()

    try {
      db.run(
        `INSERT INTO features (id, name, category, geometry_type, coordinates, properties) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, category, geometry.type, JSON.stringify(geometry.coordinates), propsJson]
      )
    } catch (err) {
      console.error('[features] POST INSERT failed:', err)
      return serverError(set)
    }

    set.status = 201
    try {
      const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(id)
      if (!row) return serverError(set)
      return toFeature(row)
    } catch (err) {
      console.error('[features] POST SELECT-after-INSERT failed:', err)
      return serverError(set)
    }
  })

  // PUT /api/features/:id
  .put('/:id', ({ params, body, set }) => {
    let existing: Record<string, unknown> | undefined
    try {
      existing = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id) ?? undefined
    } catch (err) {
      console.error(`[features] PUT /${params.id} existence check failed:`, err)
      return serverError(set)
    }
    if (!existing) return notFound(set)

    const parsed = UpdateFeatureSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', status: 400 }
    }

    const { geometry, properties } = parsed.data
    const newName = properties?.name ?? (existing.name as string)
    const newCategory = properties?.category ?? (existing.category as string) ?? 'ทั่วไป'
    const newCoordinates = geometry?.coordinates
      ? JSON.stringify(geometry.coordinates)
      : (existing.coordinates as string)
    const newGeometryType = geometry?.type ?? (existing.geometry_type as string)

    // ไม่เก็บ name / category ซ้ำใน properties JSON — อยู่ใน column เท่านั้น
    let newProperties: string | null = existing.properties as string | null
    if (properties !== undefined) {
      const { name: _name, category: _cat, ...extraProps } = properties
      newProperties = Object.keys(extraProps).length > 0 ? JSON.stringify(extraProps) : null
    }

    try {
      db.run(
        `UPDATE features SET name=?, category=?, geometry_type=?, coordinates=?, properties=? WHERE id=?`,
        [newName, newCategory, newGeometryType, newCoordinates, newProperties, params.id]
      )
    } catch (err) {
      console.error(`[features] PUT /${params.id} UPDATE failed:`, err)
      return serverError(set)
    }

    try {
      const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
      if (!row) return serverError(set)
      return toFeature(row)
    } catch (err) {
      console.error(`[features] PUT /${params.id} SELECT-after-UPDATE failed:`, err)
      return serverError(set)
    }
  })

  // DELETE /api/features/:id
  .delete('/:id', ({ params, set }) => {
    let existing: Record<string, unknown> | undefined
    try {
      existing = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id) ?? undefined
    } catch (err) {
      console.error(`[features] DELETE /${params.id} existence check failed:`, err)
      return serverError(set)
    }
    if (!existing) return notFound(set)

    try {
      db.run('DELETE FROM features WHERE id = ?', [params.id])
    } catch (err) {
      console.error(`[features] DELETE /${params.id} failed:`, err)
      return serverError(set)
    }
    set.status = 204
    // ไม่ return body — HTTP 204 No Content ต้องไม่มี body
  })
