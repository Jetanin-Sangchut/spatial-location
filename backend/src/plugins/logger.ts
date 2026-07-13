import Elysia from 'elysia'
import { randomUUID } from 'crypto'
import { db } from '../db/client'

export const loggerPlugin = new Elysia({ name: 'logger' })
  .derive({ as: 'global' }, () => ({
    requestId: randomUUID(),
    startedAt: Date.now(),
  }))
  // onBeforeHandle รันหลัง derive — จึงเข้าถึง requestId / startedAt ได้
  .onBeforeHandle({ as: 'global' }, ({ request, requestId, startedAt: _s }) => {
    const url = new URL(request.url)
    db.run(
      `INSERT OR IGNORE INTO logs (request_id, method, path, query_params, request_started_at, environment)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        request.method,
        url.pathname,
        JSON.stringify(Object.fromEntries(url.searchParams)),
        new Date().toISOString(),
        process.env.NODE_ENV ?? 'development',
      ]
    )
  })
  .onAfterResponse({ as: 'global' }, ({ set, requestId, startedAt }) => {
    const statusCode = typeof set.status === 'string'
      ? parseInt(set.status, 10)
      : (set.status ?? 200)
    db.run(
      `UPDATE logs SET status_code=?, success=?, response_time_ms=?, request_completed_at=? WHERE request_id=?`,
      [
        statusCode,
        statusCode < 400 ? 1 : 0,
        Date.now() - startedAt,
        new Date().toISOString(),
        requestId,
      ]
    )
  })
