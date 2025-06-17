"use client"

import { useState } from "react"
import { TrendingUp, Calendar, Target, Zap, ArrowUp, ArrowDown, Minus, Download } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
import { useColorPalette } from "@/lib/color-context"

interface Trend {
  id: string
  name: string
  category: string
  impact: "high" | "medium" | "low"
  direction: "up" | "down" | "stable"
  confidence: number
  timeframe: "short" | "medium" | "long"
  description: string
  data: Array<{ month: string; value: number }>
}

const mockTrends: Trend[] = [
  {
    id: "1",
    name: "AI Integration in Healthcare",
    category: "Technology",
    impact: "high",
    direction: "up",
    confidence: 92,
    timeframe: "short",
    description: "Rapid adoption of AI tools in medical diagnosis and treatment planning",
    data: [
      { month: "Jan", value: 45 },
      { month: "Feb", value: 52 },
      { month: "Mar", value: 61 },
      { month: "Apr", value: 68 },
      { month: "May", value: 75 },
      { month: "Jun", value: 82 },
    ],
  },
  {
    id: "2",
    name: "Sustainable Technology",
    category: "Environment",
    impact: "high",
    direction: "up",
    confidence: 78,
    timeframe: "long",
    description: "Growing focus on environmentally sustainable tech solutions",
    data: [
      { month: "Jan", value: 35 },
      { month: "Feb", value: 38 },
      { month: "Mar", value: 42 },
      { month: "Apr", value: 45 },
      { month: "May", value: 48 },
      { month: "Jun", value: 52 },
    ],
  },
  {
    id: "3",
    name: "Remote Work Tools",
    category: "SaaS",
    impact: "medium",
    direction: "stable",
    confidence: 85,
    timeframe: "medium",
    description: "Continued demand for collaboration and productivity tools",
    data: [
      { month: "Jan", value: 70 },
      { month: "Feb", value: 72 },
      { month: "Mar", value: 71 },
      { month: "Apr", value: 73 },
      { month: "May", value: 72 },
      { month: "Jun", value: 74 },
    ],
  },
  {
    id: "4",
    name: "Cryptocurrency Adoption",
    category: "Finance",
    impact: "medium",
    direction: "down",
    confidence: 65,
    timeframe: "short",
    description: "Declining interest in crypto investments amid market volatility",
    data: [
      { month: "Jan", value: 85 },
      { month: "Feb", value: 78 },
      { month: "Mar", value: 72 },
      { month: "Apr", value: 65 },
      { month: "May", value: 58 },
      { month: "Jun", value: 52 },
    ],
  },
]

const overallTrendData = [
  { month: "Jan", technology: 65, environment: 45, saas: 70, finance: 85 },
  { month: "Feb", technology: 72, environment: 48, saas: 72, finance: 78 },
  { month: "Mar", technology: 68, environment: 52, saas: 71, finance: 72 },
  { month: "Apr", technology: 85, environment: 58, saas: 73, finance: 65 },
  { month: "May", technology: 92, environment: 62, saas: 72, finance: 58 },
  { month: "Jun", technology: 88, environment: 65, saas: 74, finance: 52 },
]

export default function TrendsPage() {
  const { getChartColors } = useColorPalette()
  const chartColors = getChartColors()
  const [trends, setTrends] = useState<Trend[]>(mockTrends)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all")

  const filteredTrends = trends.filter((trend) => {
    const matchesCategory = selectedCategory === "all" || trend.category.toLowerCase() === selectedCategory
    const matchesTimeframe = selectedTimeframe === "all" || trend.timeframe === selectedTimeframe
    return matchesCategory && matchesTimeframe
  })

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
      medium: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
      low: "bg-neon-green/20 text-neon-green border-neon-green/50",
    }

    return (
      <Badge className={`${variants[impact as keyof typeof variants]} border`}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
      </Badge>
    )
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "up":
        return <ArrowUp className="w-4 h-4 text-neon-green" />
      case "down":
        return <ArrowDown className="w-4 h-4 text-neon-pink" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTimeframeBadge = (timeframe: string) => {
    const variants = {
      short: "bg-neon-blue/20 text-neon-blue border-neon-blue/50",
      medium: "bg-neon-purple/20 text-neon-purple border-neon-purple/50",
      long: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
    }

    return (
      <Badge variant="outline" className={`${variants[timeframe as keyof typeof variants]} border`}>
        {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}-term
      </Badge>
    )
  }

  return (
    <SidebarInset className="bg-dark-bg">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-neon-pink" />
          <h1 className="text-lg font-semibold text-white">Market Trends</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-dark-card border-dark-border text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-dark-card border-dark-border">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technology">Technology</SelectItem>
              <SelectItem value="environment">Environment</SelectItem>
              <SelectItem value="saas">SaaS</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-40 bg-dark-card border-dark-border text-white">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent className="bg-dark-card border-dark-border">
              <SelectItem value="all">All Timeframes</SelectItem>
              <SelectItem value="short">Short-term</SelectItem>
              <SelectItem value="medium">Medium-term</SelectItem>
              <SelectItem value="long">Long-term</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Overview Chart */}
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-neon-pink" />
              Trend Overview by Category
            </CardTitle>
            <CardDescription className="text-gray-400">
              Monthly trend strength across different market categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={overallTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2C2C2C",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="technology"
                  stackId="1"
                  stroke={chartColors[0]}
                  fill={chartColors[0]}
                  fillOpacity={0.3}
                  name="Technology"
                />
                <Area
                  type="monotone"
                  dataKey="environment"
                  stackId="1"
                  stroke={chartColors[1]}
                  fill={chartColors[1]}
                  fillOpacity={0.3}
                  name="Environment"
                />
                <Area
                  type="monotone"
                  dataKey="saas"
                  stackId="1"
                  stroke={chartColors[2]}
                  fill={chartColors[2]}
                  fillOpacity={0.3}
                  name="SaaS"
                />
                <Area
                  type="monotone"
                  dataKey="finance"
                  stackId="1"
                  stroke={chartColors[3]}
                  fill={chartColors[3]}
                  fillOpacity={0.3}
                  name="Finance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trends Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {filteredTrends.map((trend) => (
            <Card
              key={trend.id}
              className="bg-dark-card border-dark-border hover:border-opacity-50 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-white flex items-center gap-2">
                      {getDirectionIcon(trend.direction)}
                      {trend.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-gray-600 text-gray-400">
                        {trend.category}
                      </Badge>
                      {getTimeframeBadge(trend.timeframe)}
                    </div>
                  </div>
                  {getImpactBadge(trend.impact)}
                </div>
                <CardDescription className="text-gray-400">{trend.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Confidence Score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-dark-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-pink to-neon-blue rounded-full transition-all duration-300"
                        style={{ width: `${trend.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-white">{trend.confidence}%</span>
                  </div>
                </div>

                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.data}>
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={
                          trend.direction === "up"
                            ? chartColors[1]
                            : trend.direction === "down"
                              ? chartColors[2]
                              : chartColors[0]
                        }
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "currentColor" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#2C2C2C",
                          border: "1px solid #404040",
                          borderRadius: "4px",
                          color: "#fff",
                          fontSize: "12px",
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {trend.timeframe.charAt(0).toUpperCase() + trend.timeframe.slice(1)}-term outlook
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neon-blue hover:text-neon-blue hover:bg-neon-blue/10"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Analyze
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Insights */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-green/20">
                  <ArrowUp className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{trends.filter((t) => t.direction === "up").length}</p>
                  <p className="text-sm text-gray-400">Rising Trends</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-pink/20">
                  <Zap className="w-6 h-6 text-neon-pink" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{trends.filter((t) => t.impact === "high").length}</p>
                  <p className="text-sm text-gray-400">High Impact</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-blue/20">
                  <Target className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {Math.round(trends.reduce((acc, t) => acc + t.confidence, 0) / trends.length)}%
                  </p>
                  <p className="text-sm text-gray-400">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
