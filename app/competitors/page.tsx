"use client"

import { useState } from "react"
import { Users, TrendingUp, TrendingDown, Building, DollarSign, BarChart3, Eye, Search, Filter } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip as RechartsTooltip,
} from "recharts"
import { useColorPalette } from "@/lib/color-context"

interface Competitor {
  id: string
  name: string
  marketShare: number
  revenue: string
  employees: number
  growthRate: number
  strengths: string[]
  weaknesses: string[]
  recentActivity: string
  threat_level: "low" | "medium" | "high"
}

const mockCompetitors: Competitor[] = [
  {
    id: "1",
    name: "TechCorp Inc",
    marketShare: 18.5,
    revenue: "$2.5B",
    employees: 15000,
    growthRate: 12.3,
    strengths: ["Strong R&D", "Global presence", "Brand recognition"],
    weaknesses: ["High costs", "Slow innovation"],
    recentActivity: "Launched new AI platform",
    threat_level: "high",
  },
  {
    id: "2",
    name: "InnovateLabs",
    marketShare: 14.2,
    revenue: "$1.8B",
    employees: 8500,
    growthRate: 8.7,
    strengths: ["Agile development", "Customer focus"],
    weaknesses: ["Limited resources", "Small market presence"],
    recentActivity: "Acquired startup for $50M",
    threat_level: "medium",
  },
  {
    id: "3",
    name: "FutureSoft",
    marketShare: 22.1,
    revenue: "$3.2B",
    employees: 12000,
    growthRate: 15.6,
    strengths: ["Innovation leader", "Strong partnerships"],
    weaknesses: ["High employee turnover"],
    recentActivity: "IPO filing announced",
    threat_level: "high",
  },
  {
    id: "4",
    name: "DataDrive",
    marketShare: 9.8,
    revenue: "$1.2B",
    employees: 5500,
    growthRate: 6.2,
    strengths: ["Data analytics", "Cost efficiency"],
    weaknesses: ["Limited product range"],
    recentActivity: "New partnership with Microsoft",
    threat_level: "low",
  },
]

const competitorComparison = [
  { metric: "Innovation", us: 85, competitor1: 78, competitor2: 92, competitor3: 65 },
  { metric: "Market Reach", us: 75, competitor1: 88, competitor2: 70, competitor3: 45 },
  { metric: "Customer Satisfaction", us: 90, competitor1: 82, competitor2: 85, competitor3: 78 },
  { metric: "Financial Strength", us: 80, competitor1: 85, competitor2: 95, competitor3: 60 },
  { metric: "Technology", us: 88, competitor1: 75, competitor2: 90, competitor3: 70 },
  { metric: "Brand Recognition", us: 70, competitor1: 90, competitor2: 75, competitor3: 55 },
]

export default function CompetitorsPage() {
  const { getChartColors } = useColorPalette()
  const chartColors = getChartColors()
  const [competitors, setCompetitors] = useState<Competitor[]>(mockCompetitors)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThreatLevel, setSelectedThreatLevel] = useState<string>("all")

  const filteredCompetitors = competitors.filter((competitor) => {
    const matchesSearch = competitor.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesThreat = selectedThreatLevel === "all" || competitor.threat_level === selectedThreatLevel
    return matchesSearch && matchesThreat
  })

  const getThreatBadge = (level: string) => {
    const variants = {
      high: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
      medium: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
      low: "bg-neon-green/20 text-neon-green border-neon-green/50",
    }

    return (
      <Badge className={`${variants[level as keyof typeof variants]} border`}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Threat
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
          <Users className="w-5 h-5 text-neon-green" />
          <h1 className="text-lg font-semibold text-white">Competitor Analysis</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search competitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 bg-dark-card border-dark-border text-white placeholder:text-gray-400"
            />
          </div>
          <Button variant="outline" className="border-neon-green/50 text-neon-green hover:bg-neon-green/10">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-green/20">
                  <Users className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{competitors.length}</p>
                  <p className="text-sm text-gray-400">Active Competitors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-pink/20">
                  <TrendingUp className="w-6 h-6 text-neon-pink" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {competitors.filter((c) => c.threat_level === "high").length}
                  </p>
                  <p className="text-sm text-gray-400">High Threat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-blue/20">
                  <BarChart3 className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">64.6%</p>
                  <p className="text-sm text-gray-400">Combined Market Share</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-purple/20">
                  <DollarSign className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">$8.7B</p>
                  <p className="text-sm text-gray-400">Combined Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Competitor Comparison Chart */}
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neon-blue" />
              Competitive Analysis Radar
            </CardTitle>
            <CardDescription className="text-gray-400">Compare key metrics across competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={competitorComparison}>
                <PolarGrid stroke="#404040" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                <Radar
                  name="Us"
                  dataKey="us"
                  stroke={chartColors[0]}
                  fill={chartColors[0]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="TechCorp"
                  dataKey="competitor1"
                  stroke={chartColors[1]}
                  fill={chartColors[1]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Radar
                  name="FutureSoft"
                  dataKey="competitor2"
                  stroke={chartColors[2]}
                  fill={chartColors[2]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#2C2C2C",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Competitors List */}
        <div className="grid gap-4">
          {filteredCompetitors.map((competitor) => (
            <Card
              key={competitor.id}
              className="bg-dark-card border-dark-border hover:border-opacity-50 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-neon-green/20">
                      <Building className="w-6 h-6 text-neon-green" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{competitor.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {competitor.employees.toLocaleString()} employees • {competitor.revenue} revenue
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getThreatBadge(competitor.threat_level)}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-neon-blue hover:bg-neon-blue/10"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Market Share</span>
                      <span className="text-sm font-medium text-white">{competitor.marketShare}%</span>
                    </div>
                    <Progress value={competitor.marketShare} className="h-2 bg-dark-bg" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Growth Rate</span>
                      <div className="flex items-center gap-1">
                        {competitor.growthRate > 0 ? (
                          <TrendingUp className="w-3 h-3 text-neon-green" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-neon-pink" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            competitor.growthRate > 0 ? "text-neon-green" : "text-neon-pink"
                          }`}
                        >
                          {competitor.growthRate}%
                        </span>
                      </div>
                    </div>
                    <Progress value={Math.abs(competitor.growthRate)} className="h-2 bg-dark-bg" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-neon-green mb-2">Strengths</h4>
                    <div className="flex flex-wrap gap-1">
                      {competitor.strengths.map((strength, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-neon-green/30 text-neon-green">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neon-pink mb-2">Weaknesses</h4>
                    <div className="flex flex-wrap gap-1">
                      {competitor.weaknesses.map((weakness, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-neon-pink/30 text-neon-pink">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-dark-border">
                  <p className="text-sm text-gray-400">
                    <span className="font-medium text-white">Recent Activity:</span> {competitor.recentActivity}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </SidebarInset>
  )
}
