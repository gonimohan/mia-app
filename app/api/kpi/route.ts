import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: kpiData, error } = await supabase
      .from("kpi_metrics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: kpiData })
  } catch (error) {
    console.error("KPI API error:", error)
    return NextResponse.json({ error: "Failed to fetch KPI data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createServerClient()

    const { data, error } = await supabase.from("kpi_metrics").insert([body]).select()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("KPI POST API error:", error)
    return NextResponse.json({ error: "Failed to create KPI metric" }, { status: 500 })
  }
}
