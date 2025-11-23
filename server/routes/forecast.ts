import { Elysia, t } from 'elysia'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

export const forecastRoutes = new Elysia({ prefix: '/api/forecast' })
  .post('/generate', async ({ body, set }) => {
    try {
      // Proxy the request to Python ML service
      const response = await fetch(`${PYTHON_SERVICE_URL}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Python service error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Forecast generation error:', error)
      set.status = 500
      return {
        error: 'Failed to generate forecast',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      product: t.Optional(t.String()),
      days: t.Optional(t.Number()),
      startDate: t.Optional(t.String()),
      endDate: t.Optional(t.String()),
      algorithm: t.Optional(t.String())
    })
  })

  .get('/models', async ({ set }) => {
    try {
      // Get available models from Python service
      const response = await fetch(`${PYTHON_SERVICE_URL}/models`)

      if (!response.ok) {
        throw new Error(`Python service error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Models fetch error:', error)
      set.status = 500
      return {
        error: 'Failed to fetch models',
        models: ['catboost', 'linear', 'random_forest'] // fallback
      }
    }
  })

  .post('/train', async ({ body, set }) => {
    try {
      // Proxy training request to Python service
      const response = await fetch(`${PYTHON_SERVICE_URL}/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Python service training error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Model training error:', error)
      set.status = 500
      return {
        error: 'Failed to train model',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      modelType: t.String(),
      parameters: t.Optional(t.Any())
    })
  })

  .post('/optimize-route', async ({ body, set }) => {
    try {
      // Proxy the route optimization request to Python ML service
      const response = await fetch(`${PYTHON_SERVICE_URL}/optimize-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Python service route optimization error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Route optimization error:', error)
      set.status = 500
      return {
        error: 'Failed to optimize route',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      warehouseLocation: t.Object({
        lat: t.Number(),
        lng: t.Number()
      }),
      deliveryPoints: t.Array(t.Object({
        id: t.Optional(t.String()),
        coordinates: t.Object({
          lat: t.Number(),
          lng: t.Number()
        }),
        demand: t.Optional(t.Number())
      })),
      vehicleCapacity: t.Number(),
      vehicleCount: t.Optional(t.Number()),
      optimizationGoal: t.Optional(t.String())
    })
  })

  .post('/compliance-check', async ({ body, set }) => {
    try {
      // Proxy the compliance check request to Python service
      const response = await fetch(`${PYTHON_SERVICE_URL}/compliance-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Python service compliance check error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Compliance check error:', error)
      set.status = 500
      return {
        error: 'Failed to check compliance',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      kioskId: t.String(),
      farmerPhone: t.String(),
      transactionDetails: t.Any(),
      hetPrice: t.Number()
    })
  })

  .post('/parse-chat', async ({ body, set }) => {
    try {
      // Proxy the chat parsing request to Python service
      const response = await fetch(`${PYTHON_SERVICE_URL}/parse-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        throw new Error(`Python service chat parsing error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Chat parsing error:', error)
      set.status = 500
      return {
        error: 'Failed to parse chat',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      chatMessage: t.String()
    })
  })

  .get('/analytics', async ({ query, set }) => {
    try {
      const { product, period } = query

      // Proxy analytics request to Python service
      const url = new URL(`${PYTHON_SERVICE_URL}/analytics`)
      if (product) url.searchParams.set('product', product)
      if (period) url.searchParams.set('period', period)

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Python service analytics error: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Analytics fetch error:', error)
      set.status = 500
      return {
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  })