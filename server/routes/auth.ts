import { Elysia, t } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .use(jwt({
    name: 'jwt',
    secret: process.env.JWT_SECRET || 'your-secret-key'
  }))
  .post('/login', async ({ body, jwt, set }) => {
    const { email, password } = body

    // For now, simple mock authentication
    // In production, this would validate against your auth system
    if (email && password) {
      const token = await jwt.sign({
        userId: 'user-123',
        email,
        role: 'user'
      })

      set.status = 200
      return {
        success: true,
        token,
        user: {
          id: 'user-123',
          email,
          name: 'User Name'
        }
      }
    }

    set.status = 401
    return { error: 'Invalid credentials' }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 })
    })
  })

  .post('/register', async ({ body, jwt, set }) => {
    const { email, password, name } = body

    // Mock registration
    const token = await jwt.sign({
      userId: 'user-123',
      email,
      role: 'user'
    })

    set.status = 201
    return {
      success: true,
      token,
      user: {
        id: 'user-123',
        email,
        name
      }
    }
  }, {
    body: t.Object({
      email: t.String({ format: 'email' }),
      password: t.String({ minLength: 6 }),
      name: t.String({ minLength: 2 })
    })
  })

  .get('/me', async ({ jwt, headers, set }) => {
    const authHeader = headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      set.status = 401
      return { error: 'No token provided' }
    }

    try {
      const token = authHeader.slice(7)
      const payload = await jwt.verify(token)

      if (!payload) {
        set.status = 401
        return { error: 'Invalid token' }
      }

      return {
        user: {
          id: payload.userId,
          email: payload.email,
          name: 'User Name'
        }
      }
    } catch (error) {
      set.status = 401
      return { error: 'Invalid token' }
    }
  })