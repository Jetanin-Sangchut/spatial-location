import Elysia from 'elysia'
import { randomUUID } from 'crypto'
import { db } from '../db/client'
import { CreateFeatureSchema, UpdateFeatureSchema } from '../schemas/feature'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

// แปลง DB row เป็น GeoJSON Feature
function toFeature(row: Record<string, unknown>): GeoJSONFeature {
  return {
    id: row.id as string,
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: JSON.parse(row.coordinates as string) as [number, number],
    },
    properties: {
      name: row.name as string,
      ...(row.properties ? (JSON.parse(row.properties as string) as Record<string, unknown>) : {}),
    },
  }
}

function notFound(set: { status?: number | string }) {
  set.status = 404
  return { error: 'ไม่พบสถานที่', status: 404 }
}

export const featuresRoutes = new Elysia({ prefix: '/api/features' })

  // GET /api/features
  .get('/', () => {
    const rows = db.query<Record<string, unknown>, []>('SELECT * FROM features ORDER BY created_at DESC').all()
    const collection: GeoJSONFeatureCollection = {
      type: 'FeatureCollection',
      features: rows.map(toFeature),
    }
    return collection
  })

  // GET /api/features/:id
  .get('/:id', ({ params, set }) => {
    const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
    if (!row) return notFound(set)
    return toFeature(row)
  })

  // POST /api/features
  .post('/', ({ body, set }) => {
    const parsed = CreateFeatureSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', status: 400 }
    }

    const { geometry, properties } = parsed.data
    const id = randomUUID()

    db.run(
      `INSERT INTO features (id, name, geometry_type, coordinates, properties) VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        properties.name,
        geometry.type,
        JSON.stringify(geometry.coordinates),
        null,
      ]
    )

    set.status = 201
    const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(id)
    return toFeature(row!)
  })

  // PUT /api/features/:id
  .put('/:id', ({ params, body, set }) => {
    const existing = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
    if (!existing) return notFound(set)

    const parsed = UpdateFeatureSchema.safeParse(body)
    if (!parsed.success) {
      set.status = 400
      return { error: parsed.error.issues[0]?.message ?? 'ข้อมูลไม่ถูกต้อง', status: 400 }
    }

    const { geometry, properties } = parsed.data

    const newName = properties?.name ?? (existing.name as string)
    const newCoordinates = geometry?.coordinates
      ? JSON.stringify(geometry.coordinates)
      : (existing.coordinates as string)
    const newGeometryType = geometry?.type ?? (existing.geometry_type as string)
    const newProperties = properties !== undefined
      ? JSON.stringify(properties)
      : (existing.properties as string | null)

    db.run(
      `UPDATE features SET name=?, geometry_type=?, coordinates=?, properties=? WHERE id=?`,
      [newName, newGeometryType, newCoordinates, newProperties, params.id]
    )

    const row = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
    return toFeature(row!)
  })

  // DELETE /api/features/:id
  .delete('/:id', ({ params, set }) => {
    const existing = db.query<Record<string, unknown>, [string]>('SELECT * FROM features WHERE id = ?').get(params.id)
    if (!existing) return notFound(set)

    db.run('DELETE FROM features WHERE id = ?', [params.id])
    set.status = 204
    return ''
  })
