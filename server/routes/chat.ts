import { Elysia, t } from 'elysia'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'

// Mock chat history store - in production, this would be persistent
let chatHistory: any[] = []

export const chatRoutes = new Elysia({ prefix: '/api/chat' })
  .post('/message', async ({ body, set }) => {
    try {
      const { message, context, conversationId } = body

      // For now, we'll create a simple response
      // In production, this could proxy to a Python AI service or external API
      const response = {
        id: `msg-${Date.now()}`,
        message: `I understand you want to: ${message}. This is a placeholder response from the ElysiaJS API layer.`,
        timestamp: new Date().toISOString(),
        conversationId: conversationId || `conv-${Date.now()}`
      }

      // Store in chat history
      chatHistory.push({
        id: response.id,
        userMessage: message,
        aiResponse: response.message,
        timestamp: response.timestamp,
        conversationId: response.conversationId
      })

      return response
    } catch (error) {
      console.error('Chat message error:', error)
      set.status = 500
      return {
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }, {
    body: t.Object({
      message: t.String(),
      context: t.Optional(t.Any()),
      conversationId: t.Optional(t.String())
    })
  })

  .get('/history/:conversationId', ({ params }) => {
    const { conversationId } = params
    const conversationHistory = chatHistory.filter(chat => chat.conversationId === conversationId)

    return {
      conversationId,
      messages: conversationHistory.map(chat => ({
        id: chat.id,
        userMessage: chat.userMessage,
        aiResponse: chat.aiResponse,
        timestamp: chat.timestamp
      }))
    }
  })

  .get('/conversations', () => {
    // Get unique conversation IDs
    const conversationIds = [...new Set(chatHistory.map(chat => chat.conversationId))]

    return {
      conversations: conversationIds.map(id => {
        const messages = chatHistory.filter(chat => chat.conversationId === id)
        const lastMessage = messages[messages.length - 1]

        return {
          id,
          lastMessage: lastMessage?.timestamp || new Date().toISOString(),
          messageCount: messages.length
        }
      })
    }
  })

  .delete('/conversation/:conversationId', ({ params, set }) => {
    const { conversationId } = params
    const initialLength = chatHistory.length

    chatHistory = chatHistory.filter(chat => chat.conversationId !== conversationId)

    const deletedCount = initialLength - chatHistory.length

    if (deletedCount === 0) {
      set.status = 404
      return { error: 'Conversation not found' }
    }

    return {
      success: true,
      deletedMessages: deletedCount
    }
  })