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

// Define DataSourceFromParent based on app/data-integration/page.tsx state
interface DataSourceFromParent {
  id: string;
  name: string;
  type: string; // e.g., "api", "rss", "website_scrape", "file_upload"
  config: Record<string, any>; // Store API keys, URLs, paths, etc.
  status?: string; // e.g., "active", "inactive", "error"
  category?: string; // e.g., "Financial", "News", "Competitor"
  description?: string;
  last_sync?: string | null;
  // Add other fields if they exist in the actual DataSource type from the parent
}

interface APIKeyManagerProps {
  dataSources: DataSourceFromParent[];
}

// Define ProcessedKey for internal use within APIKeyManager
interface ProcessedKey {
  id: string;
  name: string; // This will be the data source name
  service: string; // e.g., from ds.type or ds.config.endpoint
  key: string; // From ds.config.apiKey
  status: "active" | "inactive" | "error" | "unknown"; // from ds.status
  lastUsed: string; // from ds.last_sync
  category: "news" | "financial" | "search" | "ai" | "general"; // from ds.category or ds.type
  description: string;
  endpoint: string; // from ds.config.endpoint
}

// This local APIKey interface is no longer needed as we use ProcessedKey
// interface APIKey {
//   id: string
//   name: string
//   service: string
//   key: string
//   status: "active" | "expired" | "invalid"
//   lastUsed: string
//   category: "news" | "financial" | "search" | "ai"
//   description: string
//   endpoint: string
// }

// The mock apiKeys array is no longer needed
// const apiKeys: APIKey[] = [ ... ]

export function APIKeyManager({ dataSources }: APIKeyManagerProps) {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const { toast } = useToast()

  const processedApiKeys: ProcessedKey[] = dataSources.map(ds => {
    const dsCategory = ds.category?.toLowerCase() || ds.type?.toLowerCase() || "general";
    let mappedCategory: ProcessedKey['category'] = "general";
    if (["news", "financial", "search", "ai"].includes(dsCategory)) {
      mappedCategory = dsCategory as ProcessedKey['category'];
    } else if (dsCategory.includes("news")) mappedCategory = "news";
    else if (dsCategory.includes("financ")) mappedCategory = "financial";
    else if (dsCategory.includes("search") || dsCategory.includes("tavily") || dsCategory.includes("serp")) mappedCategory = "search";
    else if (dsCategory.includes("ai") || dsCategory.includes("gemini") || dsCategory.includes("google")) mappedCategory = "ai";

    let currentStatus: ProcessedKey['status'] = "unknown";
    if (ds.status && ["active", "inactive", "error"].includes(ds.status.toLowerCase())) {
      currentStatus = ds.status.toLowerCase() as ProcessedKey['status'];
    }

    return {
      id: ds.id,
      name: ds.name,
      service: ds.config?.endpoint || ds.type || "N/A", // Prefer endpoint as service identifier
      key: ds.config?.apiKey || "Not Configured", // Ensure apiKey is the correct field in config
      status: currentStatus,
      lastUsed: ds.last_sync || "Never",
      category: mappedCategory,
      description: ds.description || "No description available.",
      endpoint: ds.config?.endpoint || "N/A",
    };
  });

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

  const testConnection = async (apiKey: ProcessedKey) => { // Updated to ProcessedKey
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

  const getStatusBadge = (status: ProcessedKey['status']) => { // Updated to use ProcessedKey['status']
    const variants = {
      active: "bg-neon-green/20 text-neon-green border-neon-green/50",
      inactive: "bg-gray-500/20 text-gray-400 border-gray-500/50", // Added inactive
      error: "bg-neon-pink/20 text-neon-pink border-neon-pink/50", // Renamed invalid to error
      unknown: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", // Added unknown
      // Keep expired and invalid if those statuses can still occur, or remove if not
      // expired: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
      // invalid: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
    };
    const currentStatusStyle = variants[status] || variants.unknown;

    return (
      <Badge className={`${currentStatusStyle} border`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  const getCategoryColor = (category: ProcessedKey['category']) => { // Updated to use ProcessedKey['category']
    const colors = {
      news: "text-neon-blue",
      financial: "text-neon-green",
      search: "text-neon-orange",
      ai: "text-neon-purple",
      general: "text-gray-400", // Added general
    };
    return colors[category] || "text-gray-400";
  }

  const filteredKeys = selectedCategory === "all"
    ? processedApiKeys
    : processedApiKeys.filter((key) => key.category === selectedCategory);

  const categories = ["all", "news", "financial", "search", "ai", "general"]; // Added general to categories

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
            {filteredKeys.map((processedKey) => ( // Renamed apiKey to processedKey for clarity
              <div
                key={processedKey.id}
                className="p-4 border border-dark-border rounded-lg bg-dark-bg/50 hover:bg-dark-bg transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-medium">{processedKey.name}</h4>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(processedKey.category)}`}>
                        {processedKey.category.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">{processedKey.description}</p>
                    <p className="text-xs text-gray-500">Service: {processedKey.service}</p>
                  </div>
                  <div className="flex items-center gap-2">{getStatusBadge(processedKey.status)}</div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-white text-sm">API Key</Label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={visibleKeys.has(processedKey.id) ? "text" : "password"}
                          value={processedKey.key} // Use processedKey
                          readOnly
                          className="bg-dark-card border-dark-border text-white pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={() => toggleKeyVisibility(processedKey.id)}
                          >
                            {visibleKeys.has(processedKey.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-white"
                            onClick={() => copyToClipboard(processedKey.key, processedKey.id)}
                          >
                            {copiedKey === processedKey.id ? (
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
                    <Input value={processedKey.endpoint} readOnly className="bg-dark-card border-dark-border text-white" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dark-border">
                    <div className="text-xs text-gray-400">Last used: {processedKey.lastUsed}</div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testConnection(processedKey)} // Use processedKey
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
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-center"> {/* Simplified to 1 column for active keys */}
            <div>
              <p className="text-2xl font-bold text-neon-green">
                {processedApiKeys.filter((k) => k.status === "active").length}
              </p>
              <p className="text-xs text-gray-400">Active Keys</p>
            </div>
            {/* Removed other mock stats */}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
