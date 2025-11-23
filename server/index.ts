import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { staticPlugin } from '@elysiajs/static'
import { config } from 'dotenv'

// Load environment variables
config()

// Import route handlers
import { authRoutes } from './routes/auth'
import { dataRoutes } from './routes/data'
import { forecastRoutes } from './routes/forecast'
import { chatRoutes } from './routes/chat'

const app = new Elysia()
  .use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  }))
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .use(staticPlugin({
    prefix: '/public'
  }))

  // Health check
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))

  // API routes
  .use(authRoutes)
  .use(dataRoutes)
  .use(forecastRoutes)
  .use(chatRoutes)

  // Error handling
  .onError(({ code, error, set }) => {
    console.error('Server Error:', error)

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Endpoint not found' }
    }

    if (code === 'VALIDATION') {
      set.status = 400
      return { error: 'Validation failed', details: error.message }
    }

    set.status = 500
    return { error: 'Internal server error' }
  })

  .listen({
    port: process.env.PORT || 3001,
    hostname: '0.0.0.0'
  })

console.log(`🚀 ElysiaJS API server running on http://localhost:${process.env.PORT || 3001}`)

export type App = typeof app