import Elysia from 'elysia'
import { randomUUID } from 'crypto'
import { db } from '../db/client'
import { CreateFeatureSchema, UpdateFeatureSchema } from '../schemas/feature'
import type { GeoJSONFeature, GeoJSONFeatureCollection } from '../types/geojson'

// แปลง DB row เป็น GeoJSON Feature — return null ถ้าข้อมูล JSON เสียหาย (ไม่ทำให้ list ทั้งหมด fail)
function toFeature(row: Record<string, unknown>): GeoJSONFeature | null {
  try {
    const coordinates = JSON.parse(row.coordinates as string)
    const geometryType = row.geometry_type as 'Point' | 'LineString' | 'Polygon'
    const extraProps = row.properties
      ? (JSON.parse(row.properties as string) as Record<string, unknown>)
      : {}
    return {
      id: row.id as string,
      type: 'Feature',
      geometry: { type: geometryType, coordinates } as GeoJSONFeature['geometry'],
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

// --- Shared OpenAPI request body schema for POST/PUT ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema = any

const geometrySchema: AnySchema = {
  oneOf: [
    {
      type: 'object',
      title: 'Point',
      required: ['type', 'coordinates'],
      properties: {
        type: { type: 'string', enum: ['Point'] },
        coordinates: {
          type: 'array',
          description: '[longitude, latitude]',
          items: { type: 'number' },
          minItems: 2,
          maxItems: 2,
          example: [100.4913, 13.75],
        },
      },
    },
    {
      type: 'object',
      title: 'LineString',
      required: ['type', 'coordinates'],
      properties: {
        type: { type: 'string', enum: ['LineString'] },
        coordinates: {
          type: 'array',
          description: 'Array of [longitude, latitude] points (min 2)',
          items: { type: 'array', items: { type: 'number' }, minItems: 2 },
          minItems: 2,
        },
      },
    },
    {
      type: 'object',
      title: 'Polygon',
      required: ['type', 'coordinates'],
      properties: {
        type: { type: 'string', enum: ['Polygon'] },
        coordinates: {
          type: 'array',
          description: 'Array of rings; each ring is a closed array of [lon, lat] (min 4 positions)',
          items: {
            type: 'array',
            items: { type: 'array', items: { type: 'number' }, minItems: 2 },
            minItems: 4,
          },
          minItems: 1,
        },
      },
    },
  ],
}

const propertiesSchema: AnySchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string', minLength: 1, example: 'วัดพระแก้ว' },
    category: {
      type: 'string',
      example: 'วัด',
      enum: ['มหาวิทยาลัย', 'วัด', 'สนามบิน', 'อุทยาน', 'หาด', 'ตลาด', 'ทั่วไป'],
    },
  },
}

const createBodySchema: AnySchema = {
  type: 'object',
  required: ['geometry', 'properties'],
  properties: { geometry: geometrySchema, properties: propertiesSchema },
}

const updateBodySchema: AnySchema = {
  type: 'object',
  description: 'All fields are optional — only provided fields are updated',
  properties: {
    geometry: geometrySchema,
    properties: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, example: 'ชื่อใหม่' },
        category: {
          type: 'string',
          enum: ['มหาวิทยาลัย', 'วัด', 'สนามบิน', 'อุทยาน', 'หาด', 'ตลาด', 'ทั่วไป'],
        },
      },
    },
  },
}

const postExamples = {
  Point: {
    summary: 'Point — วัดพระแก้ว ABC',
    value: {
      geometry: { type: 'Point', coordinates: [100.4913, 13.7500] },
      properties: { name: 'วัดพระแก้ว ABC', category: 'วัด' },
    },
  },
  LineString: {
    summary: 'LineString — ถนนสาธรใต้',
    value: {
      geometry: {
        type: 'LineString',
        coordinates: [[100.5220, 13.7218], [100.5285, 13.7241], [100.5340, 13.7260]],
      },
      properties: { name: 'ถนนสาธรใต้', category: 'ทั่วไป' },
    },
  },
  Polygon: {
    summary: 'Polygon — สวนเบญจกิติ',
    value: {
      geometry: {
        type: 'Polygon',
        coordinates: [[[100.5404, 13.7290], [100.5454, 13.7290], [100.5454, 13.7330], [100.5404, 13.7330], [100.5404, 13.7290]]],
      },
      properties: { name: 'สวนเบญจกิติ', category: 'อุทยาน' },
    },
  },
}

// --- Routes ---

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
  }, {
    detail: {
      tags: ['Features'],
      summary: 'List all features',
      description: 'Returns all spatial features as a GeoJSON FeatureCollection (Point, LineString, Polygon), ordered by creation date descending.',
    },
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
  }, {
    detail: {
      tags: ['Features'],
      summary: 'Get feature by ID',
      description: 'Returns a single GeoJSON Feature by UUID. Returns 404 if not found.',
    },
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
  }, {
    detail: {
      tags: ['Features'],
      summary: 'Create a spatial feature',
      description:
        'Creates a new GeoJSON feature. Supports **Point**, **LineString**, and **Polygon** geometries.\n\n' +
        'Geometry coordinates are validated via Zod discriminated union — coordinate shape is enforced per geometry type.\n\n' +
        'Returns the persisted row (SELECT-after-write) with DB-generated `id` and `created_at`.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: createBodySchema,
            examples: postExamples,
          },
        },
      },
    },
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
  }, {
    detail: {
      tags: ['Features'],
      summary: 'Update a feature (partial)',
      description:
        'Partially updates an existing feature. All body fields are optional — only provided fields are applied.\n\n' +
        'Returns the updated row (SELECT-after-write). Returns 404 if ID not found.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: updateBodySchema,
            examples: {
              'Full update': {
                summary: 'Update geometry + name + category (matches Postman)',
                value: { geometry: { type: 'Point', coordinates: [100.5, 13.7] }, properties: { name: 'ชื่อใหม่', category: 'ทั่วไป' } },
              },
              'Name only': {
                summary: 'Rename only',
                value: { properties: { name: 'ชื่อใหม่' } },
              },
              'Category only': {
                summary: 'Change category only',
                value: { properties: { category: 'วัด' } },
              },
            },
          },
        },
      },
    },
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
  }, {
    detail: {
      tags: ['Features'],
      summary: 'Delete a feature',
      description: 'Permanently deletes a spatial feature. Returns 204 No Content on success, 404 if ID not found.',
    },
  })
