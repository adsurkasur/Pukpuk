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