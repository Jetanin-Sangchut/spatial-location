import Elysia from 'elysia'
import { db } from '../db/client'

interface LogRow {
  id: number
  request_id: string
  method: string | null
  path: string | null
  query_params: string | null
  body: string | null
  status_code: number | null
  success: number | null
  response_time_ms: number | null
  ip_address: string | null
  user_agent: string | null
  environment: string | null
  request_started_at: string | null
  request_completed_at: string | null
}

export const logsRoutes = new Elysia({ prefix: '/api/logs' })

  // GET /api/logs?limit=100&from=ISO&to=ISO
  .get('/', ({ query }) => {
    const rawLimit = query.limit !== undefined ? parseInt(String(query.limit), 10) : 100
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 100
    const from = query.from as string | undefined
    const to = query.to as string | undefined

    // ตรวจ format ISO 8601 ก่อนใช้เป็น filter — ป้องกันผลลัพธ์ผิดจาก SQLite string comparison
    const ISO_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/
    if (from && !ISO_RE.test(from)) return { error: 'invalid from — ต้องเป็น ISO 8601', status: 400 }
    if (to && !ISO_RE.test(to)) return { error: 'invalid to — ต้องเป็น ISO 8601', status: 400 }

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (from) {
      conditions.push('request_started_at >= ?')
      params.push(from)
    }
    if (to) {
      conditions.push('request_started_at <= ?')
      params.push(to)
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const sql = `SELECT * FROM logs ${where} ORDER BY request_started_at DESC LIMIT ?`
    params.push(limit)

    const rows = db.query<LogRow, (string | number)[]>(sql).all(...params)
    return { logs: rows, count: rows.length }
  }, {
    detail: {
      tags: ['Logs'],
      summary: 'List request logs',
      description:
        'Returns request logs with response time measurements, ordered by start time descending.\n\n' +
        'Logs use a two-phase pattern: INSERT on `onBeforeHandle`, UPDATE with status + `response_time_ms` on `onAfterResponse` — so partial rows exist even if the server crashes mid-request.\n\n' +
        '**Query params:**\n- `limit` — max results (default 100, max 500)\n- `from` — ISO 8601 start time filter\n- `to` — ISO 8601 end time filter',
    },
  })
