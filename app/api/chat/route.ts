import { type NextRequest, NextResponse } from "next/server"

const PYTHON_API_BASE_URL = process.env.PYTHON_AGENT_API_BASE_URL || "http://0.0.0.0:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ 
        error: "messages array is required" 
      }, { status: 400 })
    }

    // Try to connect to Python API
    try {
      const response = await fetch(`${PYTHON_API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          context: context || {}
        }),
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        throw new Error(`Python API responded with status: ${response.status}`)
      }

      const data = await response.json()
      return NextResponse.json(data)
    } catch (apiError) {
      console.error("Python API error:", apiError)
      
      // Return mock response when backend is unavailable
      const lastMessage = messages[messages.length - 1]?.content || ""
      
      return NextResponse.json({
        response: `I understand you're asking about: "${lastMessage}". Currently, the AI service is temporarily unavailable, but I would normally provide detailed market intelligence insights based on your query. Please try again later when the service is restored.`,
        context: {
          query: lastMessage,
          timestamp: new Date().toISOString(),
          status: "fallback_mode"
        }
      })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ 
      error: "Failed to process chat request",
      response: "I apologize, but I'm currently experiencing technical difficulties. Please try again later."
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Chat API is running",
    timestamp: new Date().toISOString() 
  })
}
