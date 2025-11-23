import { Elysia, t } from 'elysia'
import { GoogleGenerativeAI } from '@google/generative-ai'

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

// Initialize Gemini AI
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

// Mock chat history store - in production, this would be persistent
let chatHistory: any[] = []

export const chatRoutes = new Elysia({ prefix: '/api/chat' })
  .post('/message', async ({ body, set }) => {
    try {
      const { message, context, conversationId } = body

      let aiResponse = 'I apologize, but AI services are not configured.'

      if (genAI) {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

        // Create agentic prompt with tool capabilities
        const systemPrompt = `You are PUKPUK, an intelligent agricultural supply chain assistant. You have access to various tools and can perform actions like:
- Forecasting fertilizer demand
- Checking inventory levels
- Optimizing delivery routes
- Generating reports
- Providing compliance information

When users ask you to perform tasks, respond helpfully and offer to execute actions. Be conversational but professional.

User message: ${message}
Context: ${JSON.stringify(context || {})}

Respond as an agentic AI that can take actions.`

        const result = await model.generateContent(systemPrompt)
        aiResponse = result.response.text()
      } else {
        // Fallback response
        aiResponse = `I understand you want to: ${message}. As PUKPUK AI, I can help with fertilizer supply chain management, demand forecasting, and compliance monitoring.`
      }

      const response = {
        id: `msg-${Date.now()}`,
        message: aiResponse,
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