"use client"

import { useState } from "react"
import { TrendingUp, Users, Heart, PieChart, RefreshCw, Zap, Activity, Target, Briefcase } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KPICard } from "@/components/kpi-card"
import { Separator } from "@/components/ui/separator"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
} from "recharts"
import { useColorPalette } from "@/lib/color-context"

// Sample data for charts
const trendData = [
  { month: "Jan", value: 65, competitors: 45 },
  { month: "Feb", value: 72, competitors: 48 },
  { month: "Mar", value: 68, competitors: 52 },
  { month: "Apr", value: 85, competitors: 58 },
  { month: "May", value: 92, competitors: 62 },
  { month: "Jun", value: 88, competitors: 65 },
]

const marketShareData = [
  { name: "Our Company", value: 35, color: "#00FFFF" },
  { name: "Competitor A", value: 25, color: "#39FF14" },
  { name: "Competitor B", value: 20, color: "#FF1493" },
  { name: "Others", value: 20, color: "#BF00FF" },
]

const competitorData = [
  { name: "TechCorp", activity: 85, growth: 12.3 },
  { name: "InnovateLabs", activity: 72, growth: 8.7 },
  { name: "FutureSoft", activity: 91, growth: 15.6 },
  { name: "DataDrive", activity: 68, growth: 6.2 },
]

export default function DashboardPage() {
  const { getChartColors } = useColorPalette()
  const chartColors = getChartColors()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [kpiData, setKpiData] = useState([
    { title: "Market Growth", value: 15.7, unit: "%", change: 2.3, icon: TrendingUp, color: "blue" },
    { title: "Competitor Activity", value: 847, unit: "companies", change: -5.2, icon: Users, color: "green" },
    { title: "Consumer Sentiment", value: 78.5, unit: "score", change: 12.1, icon: Heart, color: "pink" },
    { title: "Market Share", value: 23.4, unit: "%", change: 0.8, icon: PieChart, color: "purple" },
  ])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update KPI data with random changes
    setKpiData((prev) =>
      prev.map((kpi) => ({
        ...kpi,
        change: (Math.random() - 0.5) * 20, // Random change between -10 and +10
      })),
    )

    setIsRefreshing(false)
  }

  return (
    <SidebarInset className="bg-dark-bg">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-blue" />
          <h1 className="text-lg font-semibold text-white">Market Intelligence Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30 hover:shadow-neon-blue/50 hover:shadow-lg transition-all duration-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} {...kpi} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trend Chart */}
          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-neon-blue" />
                Market Trends
              </CardTitle>
              <CardDescription className="text-gray-400">Monthly performance vs competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
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
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={chartColors[0]}
                    strokeWidth={3}
                    dot={{ fill: chartColors[0], strokeWidth: 2, r: 6 }}
                    name="Our Performance"
                  />
                  <Line
                    type="monotone"
                    dataKey="competitors"
                    stroke={chartColors[1]}
                    strokeWidth={2}
                    dot={{ fill: chartColors[1], strokeWidth: 2, r: 4 }}
                    name="Competitors Avg"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Market Share Chart */}
          <Card className="bg-dark-card border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <PieChart className="w-5 h-5 text-neon-pink" />
                Market Share
              </CardTitle>
              <CardDescription className="text-gray-400">Current market distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={marketShareData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {marketShareData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2C2C2C",
                      border: "1px solid #404040",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Competitor Activity */}
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-green" />
              Competitor Activity
            </CardTitle>
            <CardDescription className="text-gray-400">Recent competitor performance and growth rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competitorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2C2C2C",
                    border: "1px solid #404040",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="activity" fill={chartColors[1]} name="Activity Score" />
                <Bar dataKey="growth" fill={chartColors[2]} name="Growth Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-dark-card border-dark-border hover:border-neon-blue/50 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-blue/20 group-hover:bg-neon-blue/30 transition-colors">
                  <Target className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Generate Report</h3>
                  <p className="text-sm text-gray-400">Create comprehensive market analysis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border hover:border-neon-green/50 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-green/20 group-hover:bg-neon-green/30 transition-colors">
                  <Zap className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Insights</h3>
                  <p className="text-sm text-gray-400">Get AI-powered recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border hover:border-neon-pink/50 transition-all duration-300 cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-pink/20 group-hover:bg-neon-pink/30 transition-colors">
                  <Briefcase className="w-6 h-6 text-neon-pink" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Export Data</h3>
                  <p className="text-sm text-gray-400">Download reports and datasets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
