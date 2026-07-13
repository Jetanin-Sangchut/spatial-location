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
    const limit = Math.min(Number(query.limit ?? 100), 500)
    const from = query.from as string | undefined
    const to = query.to as string | undefined

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
  })
