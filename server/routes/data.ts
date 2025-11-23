import { Elysia, t } from 'elysia'

// Mock data store - in production, this would be your database
let demands: any[] = []
let products: any[] = []

export const dataRoutes = new Elysia({ prefix: '/api' })
  // Products endpoints
  .get('/products', () => {
    return { products }
  })

  .post('/products', ({ body, set }) => {
    const newProduct = {
      id: `prod-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    }
    products.push(newProduct)
    set.status = 201
    return newProduct
  }, {
    body: t.Object({
      name: t.String(),
      category: t.String(),
      unit: t.Optional(t.String())
    })
  })

  // Demands endpoints
  .get('/demands', ({ query }) => {
    const { page = 1, limit = 50, product, startDate, endDate } = query

    let filteredDemands = [...demands]

    if (product) {
      filteredDemands = filteredDemands.filter(d => d.productName === product)
    }

    if (startDate) {
      filteredDemands = filteredDemands.filter(d => d.date >= startDate)
    }

    if (endDate) {
      filteredDemands = filteredDemands.filter(d => d.date <= endDate)
    }

    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const paginatedDemands = filteredDemands.slice(startIndex, endIndex)

    return {
      demands: paginatedDemands,
      total: filteredDemands.length,
      page: Number(page),
      limit: Number(limit)
    }
  })

  .post('/demands', ({ body, set }) => {
    const newDemand = {
      id: `demand-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString()
    }
    demands.push(newDemand)
    set.status = 201
    return newDemand
  }, {
    body: t.Object({
      productName: t.String(),
      quantity: t.Number(),
      unit: t.String(),
      price: t.Number(),
      date: t.String(),
      location: t.Optional(t.String())
    })
  })

  .put('/demands/:id', ({ params, body, set }) => {
    const { id } = params
    const index = demands.findIndex(d => d.id === id)

    if (index === -1) {
      set.status = 404
      return { error: 'Demand not found' }
    }

    demands[index] = { ...demands[index], ...body, updatedAt: new Date().toISOString() }
    return demands[index]
  }, {
    body: t.Object({
      productName: t.Optional(t.String()),
      quantity: t.Optional(t.Number()),
      unit: t.Optional(t.String()),
      price: t.Optional(t.Number()),
      date: t.Optional(t.String()),
      location: t.Optional(t.String())
    })
  })

  .delete('/demands/:id', ({ params, set }) => {
    const { id } = params
    const index = demands.findIndex(d => d.id === id)

    if (index === -1) {
      set.status = 404
      return { error: 'Demand not found' }
    }

    demands.splice(index, 1)
    set.status = 204
    return null
  })

  // Bulk import endpoint
  .post('/bulk-import', async ({ body, set }) => {
    const { data, type } = body

    if (type === 'demands') {
      const newDemands = data.map((item: any) => ({
        id: `demand-${Date.now()}-${Math.random()}`,
        ...item,
        createdAt: new Date().toISOString()
      }))
      demands.push(...newDemands)
      return { success: true, imported: newDemands.length }
    }

    set.status = 400
    return { error: 'Invalid import type' }
  }, {
    body: t.Object({
      data: t.Array(t.Any()),
      type: t.String()
    })
  })

  // Clear all demands
  .delete('/demands', () => {
    const count = demands.length
    demands = []
    return { success: true, cleared: count }
  })