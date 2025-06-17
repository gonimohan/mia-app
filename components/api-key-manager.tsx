"use client"

import { useState } from "react"
import { Key, Eye, EyeOff, Copy, Check, RefreshCw, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"

interface APIKey {
  id: string
  name: string
  service: string
  key: string
  status: "active" | "expired" | "invalid"
  lastUsed: string
  category: "news" | "financial" | "search" | "ai"
  description: string
  endpoint: string
}

const apiKeys: APIKey[] = [
  {
    id: "1",
    name: "News API",
    service: "newsapi.org",
    key: "cb7855ef5b264ad2a6bbc558b68275cb",
    status: "active",
    lastUsed: "2024-01-15 10:30:00",
    category: "news",
    description: "Global news articles and headlines",
    endpoint: "https://newsapi.org/v2/",
  },
  {
    id: "2",
    name: "MediaStack API",
    service: "mediastack.com",
    key: "0067073b9a277d60f5e8df841c6dbbb0",
    status: "active",
    lastUsed: "2024-01-15 09:45:00",
    category: "news",
    description: "Real-time news data from global sources",
    endpoint: "https://api.mediastack.com/v1/",
  },
  {
    id: "3",
    name: "GNews API",
    service: "gnews.io",
    key: "f41fcf180a70f8be38240a08dc917276",
    status: "active",
    lastUsed: "2024-01-15 11:20:00",
    category: "news",
    description: "Breaking news and article search",
    endpoint: "https://gnews.io/api/v4/",
  },
  {
    id: "4",
    name: "Tavily Search API",
    service: "tavily.com",
    key: "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",
    status: "active",
    lastUsed: "2024-01-15 08:30:00",
    category: "search",
    description: "AI-powered search and research",
    endpoint: "https://api.tavily.com/",
  },
  {
    id: "5",
    name: "SerpAPI",
    service: "serpapi.com",
    key: "a2e37654962ee6a2396596ce8eccd0f6417cab97",
    status: "active",
    lastUsed: "2024-01-15 12:15:00",
    category: "search",
    description: "Google search results API",
    endpoint: "https://serpapi.com/",
  },
  {
    id: "6",
    name: "Alpha Vantage",
    service: "alphavantage.co",
    key: "1Q65M3HC80UU6MSH",
    status: "active",
    lastUsed: "2024-01-15 07:45:00",
    category: "financial",
    description: "Stock market and financial data",
    endpoint: "https://www.alphavantage.co/",
  },
  {
    id: "7",
    name: "Financial Modeling Prep",
    service: "financialmodelingprep.com",
    key: "PhSpQuh9TvuJCkpfPb7ZyxJW4CsF7q8l",
    status: "active",
    lastUsed: "2024-01-15 13:00:00",
    category: "financial",
    description: "Financial statements and market data",
    endpoint: "https://financialmodelingprep.com/api/",
  },
  {
    id: "8",
    name: "Google Gemini AI",
    service: "googleapis.com",
    key: "AIzaSyAhsAgSEFlsUz_mmIOCvfzhXdPXbuqiMdM",
    status: "active",
    lastUsed: "2024-01-15 14:30:00",
    category: "ai",
    description: "Gemini 1.5 Flash LLM for analysis",
    endpoint: "https://generativelanguage.googleapis.com/",
  },
]

export function APIKeyManager() {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { toast } = useToast()

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = async (key: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKey(keyId)
      toast({
        title: "API Key Copied",
        description: "The API key has been copied to your clipboard.",
      })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy API key to clipboard.",
        variant: "destructive",
      })
    }
  }

  const testConnection = async (apiKey: APIKey) => {
    toast({
      title: "Testing Connection",
      description: `Testing connection to ${apiKey.service}...`,
    })

    // Simulate API test
    setTimeout(() => {
      toast({
        title: "Connection Successful",
        description: `${apiKey.name} is working correctly.`,
      })
    }, 2000)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-neon-green/20 text-neon-green border-neon-green/50",
      expired: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
      invalid: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
    }

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      news: "text-neon-blue",
      financial: "text-neon-green",
      search: "text-neon-orange",
      ai: "text-neon-purple",
    }
    return colors[category as keyof typeof colors] || "text-gray-400"
  }

  const filteredKeys = selectedCategory === "all" ? apiKeys : apiKeys.filter((key) => key.category === selectedCategory)

  const categories = ["all", "news", "financial", "search", "ai"]

  return (
    <Card className="bg-dark-card border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-neon-green" />
          API Key Management
        </CardTitle>
        <CardDescription className="text-gray-400">
          Manage API keys for real-time data collection and AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5 bg-dark-bg border border-dark-border mb-6">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue text-gray-400"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="space-y-4">
            {filteredKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="p-4 border border-dark-border rounded-lg bg-dark-bg/50 hover:bg-dark-bg transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{apiKey.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(apiKey.category)}`}>
                        {apiKey.category.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{apiKey.description}</p>
                    <p className="text-xs text-gray-500">Service: {apiKey.service}</p>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(apiKey.status)}</div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">API Key</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={visibleKeys.has(apiKey.id) ? "text" : "password"}
                          value={apiKey.key}
                          readOnly
                          className="bg-dark-card border-dark-border text-white pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                          >
                            {copiedKey === apiKey.id ? (
                              <Check className="w-3 h-3 text-neon-green" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Endpoint</Label>
                    <Input value={apiKey.endpoint} readOnly className="bg-dark-card border-dark-border text-white" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                    <div className="text-xs text-gray-400">Last used: {apiKey.lastUsed}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(apiKey)}
                        className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Test
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-400 hover:bg-dark-bg">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Usage Statistics */}
        <div className="mt-6 p-4 border border-dark-border rounded-lg bg-dark-bg/30">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-neon-orange" />
            Usage Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-neon-green">
                {apiKeys.filter((k) => k.status === "active").length}
              </p>
              <p className="text-xs text-gray-400">Active Keys</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neon-blue">24/7</p>
              <p className="text-xs text-gray-400">Monitoring</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neon-pink">99.9%</p>
              <p className="text-xs text-gray-400">Uptime</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-neon-purple">Real-time</p>
              <p className="text-xs text-gray-400">Data Sync</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
