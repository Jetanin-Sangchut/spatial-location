import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { loggerPlugin } from './plugins/logger'
import { featuresRoutes } from './routes/features'
import { logsRoutes } from './routes/logs'
import './db/seed'

export const app = new Elysia()
  .use(cors())
  .use(swagger({
    path: '/swagger',
    documentation: {
      info: {
        title: 'Spatial Data Platform API',
        version: '1.0.0',
        description:
          'RESTful GeoJSON API for managing spatial features (Point, LineString, Polygon).\n\n' +
          'Built with **Elysia + Bun + SQLite** — zero-dependency, spec-compliant GeoJSON responses.\n\n' +
          'All write endpoints return the persisted row (SELECT-after-write), including DB-generated defaults.',
        contact: { name: 'Jetanin Sangchut', url: 'https://github.com/Jetanin-Sangchut/spatial-location' },
      },
      tags: [
        { name: 'Features', description: 'CRUD operations on spatial features (GeoJSON)' },
        { name: 'Logs', description: 'Request logs with response time measurement' },
        { name: 'Health', description: 'Service health check' },
      ],
      servers: [
        { url: 'https://spatial-location-production.up.railway.app', description: 'Production (Railway)' },
        { url: 'http://localhost:3000', description: 'Local development' },
      ],
    },
  }))
  .use(loggerPlugin)
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }), {
    detail: { tags: ['Health'], summary: 'Health check', description: 'Returns service status and current UTC timestamp.' },
  })
  .use(featuresRoutes)
  .use(logsRoutes)
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' })

export type App = typeof app

console.log(`Backend running on http://localhost:${app.server?.port}`)
