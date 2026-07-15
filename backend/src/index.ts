import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { cors } from '@elysiajs/cors'
import { loggerPlugin } from './plugins/logger'
import { featuresRoutes } from './routes/features'
import { logsRoutes } from './routes/logs'
import './db/seed'

export const app = new Elysia()
  .use(cors())
  .use(swagger({ path: '/swagger' }))
  .use(loggerPlugin)
  .get('/api/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(featuresRoutes)
  .use(logsRoutes)
  .listen({ port: Number(process.env.PORT ?? 3000), hostname: '0.0.0.0' })

export type App = typeof app

console.log(`Backend running on http://localhost:${app.server?.port}`)
