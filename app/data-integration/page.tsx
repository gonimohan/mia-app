"use client"

import { useState } from "react"
import {
  Database,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Globe,
  FileText,
  Trash2,
  Edit,
  Zap,
  Newspaper,
  TrendingUp,
  Search,
} from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { APIKeyManager } from "@/components/api-key-manager"
import { RealTimeSync } from "@/components/real-time-sync"

interface DataSource {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "error"
  lastSync: string
  config: Record<string, any>
  description?: string
  category?: "news" | "financial" | "search" | "ai"
}

const mockDataSources: DataSource[] = [
  {
    id: "1",
    name: "News API",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 10:30:00",
    config: { endpoint: "https://newsapi.org/v2/", apiKey: "cb7855ef5b264ad2a6bbc558b68275cb" },
  },
  {
    id: "2",
    name: "MediaStack API",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 09:45:00",
    config: { endpoint: "https://api.mediastack.com/v1/", apiKey: "0067073b9a277d60f5e8df841c6dbbb0" },
  },
  {
    id: "3",
    name: "GNews API",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 11:20:00",
    config: { endpoint: "https://gnews.io/api/v4/", apiKey: "f41fcf180a70f8be38240a08dc917276" },
  },
  {
    id: "4",
    name: "Tavily Search API",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 08:30:00",
    config: { endpoint: "https://api.tavily.com/", apiKey: "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" },
  },
  {
    id: "5",
    name: "SerpAPI",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 12:15:00",
    config: { endpoint: "https://serpapi.com/", apiKey: "a2e37654962ee6a2396596ce8eccd0f6417cab97" },
  },
  {
    id: "6",
    name: "Alpha Vantage",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 07:45:00",
    config: { endpoint: "https://www.alphavantage.co/", apiKey: "1Q65M3HC80UU6MSH" },
  },
  {
    id: "7",
    name: "Financial Modeling Prep",
    type: "api",
    status: "active",
    lastSync: "2024-01-15 13:00:00",
    config: { endpoint: "https://financialmodelingprep.com/api/", apiKey: "PhSpQuh9TvuJCkpfPb7ZyxJW4CsF7q8l" },
  },
  {
    id: "8",
    name: "Google Gemini AI",
    type: "llm",
    status: "active",
    lastSync: "2024-01-15 14:30:00",
    config: {
      endpoint: "https://generativelanguage.googleapis.com/",
      apiKey: "AIzaSyAhsAgSEFlsUz_mmIOCvfzhXdPXbuqiMdM",
    },
  },
]

export default function DataIntegrationPage() {
  const [dataSources, setDataSources] = useState<DataSource[]>(mockDataSources)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newSource, setNewSource] = useState({
    name: "",
    type: "api",
    endpoint: "",
    apiKey: "",
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-neon-green" />
      case "error":
        return <XCircle className="w-4 h-4 text-neon-pink" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-neon-green/20 text-neon-green border-neon-green/50",
      error: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
      inactive: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    }

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleAddSource = () => {
    const newDataSource: DataSource = {
      id: Date.now().toString(),
      name: newSource.name,
      type: newSource.type,
      status: "inactive",
      lastSync: "Never",
      config: {
        endpoint: newSource.endpoint,
        apiKey: newSource.apiKey,
      },
    }

    setDataSources([...dataSources, newDataSource])
    setNewSource({ name: "", type: "api", endpoint: "", apiKey: "" })
    setIsAddDialogOpen(false)
  }

  const getSourceIcon = (type: string, category?: string) => {
    if (type === "llm") return <Zap className="w-5 h-5 text-neon-purple" />
    if (category === "news") return <Newspaper className="w-5 h-5 text-neon-blue" />
    if (category === "financial") return <TrendingUp className="w-5 h-5 text-neon-green" />
    if (category === "search") return <Search className="w-5 h-5 text-neon-orange" />
    return <Globe className="w-5 h-5 text-neon-orange" />
  }

  return (
    <SidebarInset className="bg-dark-bg">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-neon-orange" />
          <h1 className="text-lg font-semibold text-white">Data Integration</h1>
        </div>
        <div className="ml-auto">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30 hover:shadow-neon-green/50 hover:shadow-lg transition-all duration-300">
                <Plus className="w-4 h-4 mr-2" />
                Add New Data Source
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-dark-card border-dark-border text-white">
              <DialogHeader>
                <DialogTitle className="text-neon-green">Add New Data Source</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure a new data source for market intelligence gathering.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newSource.name}
                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                    className="bg-dark-bg border-dark-border text-white"
                    placeholder="Enter data source name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type" className="text-white">
                    Type
                  </Label>
                  <Select value={newSource.type} onValueChange={(value) => setNewSource({ ...newSource, type: value })}>
                    <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border-dark-border">
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endpoint" className="text-white">
                    Endpoint URL
                  </Label>
                  <Input
                    id="endpoint"
                    value={newSource.endpoint}
                    onChange={(e) => setNewSource({ ...newSource, endpoint: e.target.value })}
                    className="bg-dark-bg border-dark-border text-white"
                    placeholder="https://api.example.com/"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey" className="text-white">
                    API Key
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newSource.apiKey}
                    onChange={(e) => setNewSource({ ...newSource, apiKey: e.target.value })}
                    className="bg-dark-bg border-dark-border text-white"
                    placeholder="Enter API key"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddSource}
                  className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30"
                >
                  Add Data Source
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Tabs defaultValue="sources" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-dark-card border border-dark-border">
            <TabsTrigger
              value="sources"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue data-[state=active]:border-b-2 data-[state=active]:border-neon-blue"
            >
              Data Sources
            </TabsTrigger>
            <TabsTrigger
              value="api-keys"
              className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green data-[state=active]:border-b-2 data-[state=active]:border-neon-green"
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="real-time"
              className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple data-[state=active]:border-b-2 data-[state=active]:border-neon-purple"
            >
              Real-Time Sync
            </TabsTrigger>
            <TabsTrigger
              value="configuration"
              className="data-[state=active]:bg-neon-pink/20 data-[state=active]:text-neon-pink data-[state=active]:border-b-2 data-[state=active]:border-neon-pink"
            >
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="space-y-4">
            <div className="grid gap-4">
              {dataSources.map((source) => (
                <Card
                  key={source.id}
                  className="bg-dark-card border-dark-border hover:border-opacity-50 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-neon-orange/20">
                          {source.type === "api" ? (
                            <Globe className="w-5 h-5 text-neon-orange" />
                          ) : source.type === "database" ? (
                            <Database className="w-5 h-5 text-neon-orange" />
                          ) : (
                            <FileText className="w-5 h-5 text-neon-orange" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-white">{source.name}</CardTitle>
                          <CardDescription className="text-gray-400 capitalize">
                            {source.type} Integration
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(source.status)}
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-dark-bg">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(source.status)}
                          <span>Status: {source.status}</span>
                        </div>
                        <div>Last Sync: {source.lastSync}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                        >
                          Test Connection
                        </Button>
                        <Button size="sm" className="bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30">
                          Sync Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-4">
            <APIKeyManager />
          </TabsContent>

          <TabsContent value="real-time" className="space-y-4">
            <RealTimeSync />
          </TabsContent>

          <TabsContent value="configuration" className="space-y-4">
            <Card className="bg-dark-card border-dark-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-neon-pink" />
                  Integration Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure global settings for data integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label className="text-white">Sync Frequency</Label>
                    <Select defaultValue="hourly">
                      <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white">Data Retention Period</Label>
                    <Select defaultValue="90days">
                      <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="30days">30 Days</SelectItem>
                        <SelectItem value="90days">90 Days</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="unlimited">Unlimited</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white">Error Notification</Label>
                    <Select defaultValue="email">
                      <SelectTrigger className="bg-dark-bg border-dark-border text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-dark-card border-dark-border">
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="slack">Slack</SelectItem>
                        <SelectItem value="webhook">Webhook</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-neon-pink/20 border border-neon-pink/50 text-neon-pink hover:bg-neon-pink/30">
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  )
}
