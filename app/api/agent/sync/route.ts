import { type NextRequest, NextResponse } from "next/server"

const PYTHON_API_BASE_URL = process.env.PYTHON_AGENT_API_BASE_URL || "http://localhost:8000"

// API Keys from environment
const API_KEYS = {
  NEWS_API_KEY: process.env.NEWS_API_KEY,
  MEDIASTACK_API_KEY: process.env.MEDIASTACK_API_KEY,
  GNEWS_API_KEY: process.env.GNEWS_API_KEY,
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
  ALPHA_VANTAGE_API_KEY: process.env.ALPHA_VANTAGE_API_KEY,
  FINANCIAL_MODELING_PREP_API_KEY: process.env.FINANCIAL_MODELING_PREP_API_KEY,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sources, market_domain, sync_type = "full" } = body

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json({ error: "Sources array is required" }, { status: 400 })
    }

    // Prepare the sync request with API keys
    const syncRequest = {
      sources,
      market_domain: market_domain || "general",
      sync_type,
      api_keys: API_KEYS,
      timestamp: new Date().toISOString(),
    }

    const response = await fetch(`${PYTHON_API_BASE_URL}/sync-data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(syncRequest),
    })

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Agent sync API error:", error)
    return NextResponse.json({ error: "Failed to sync data with agent" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const response = await fetch(`${PYTHON_API_BASE_URL}/sync-status${status ? `?status=${status}` : ""}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Python API responded with status: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Agent sync status API error:", error)
    return NextResponse.json({ error: "Failed to get sync status" }, { status: 500 })
  }
}
