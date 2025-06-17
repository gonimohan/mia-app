import { type NextRequest, NextResponse } from "next/server"

const PYTHON_API_BASE_URL = process.env.PYTHON_AGENT_API_BASE_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, session_id } = body

    if (!message || !session_id) {
      return NextResponse.json({ error: "Message and session_id are required" }, { status: 400 })
    }

    const response = await fetch(`${PYTHON_API_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        session_id,
      }),
    })

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
