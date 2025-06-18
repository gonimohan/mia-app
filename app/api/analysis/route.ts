import { type NextRequest, NextResponse } from "next/server"

const PYTHON_API_BASE_URL = process.env.PYTHON_AGENT_API_BASE_URL || "http://localhost:8000"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query_str, market_domain_str, question_str } = body

    if (!query_str || !market_domain_str) {
      return NextResponse.json({ error: "query_str and market_domain_str are required" }, { status: 400 })
    }

    const response = await fetch(`${PYTHON_API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: query_str,
        market_domain: market_domain_str,
        question: question_str,
      }),
    })

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Analysis API error:", error)
    return NextResponse.json({ error: "Failed to process analysis request" }, { status: 500 })
  }
}
