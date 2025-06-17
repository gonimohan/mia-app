"use client"

import { useState, useEffect } from "react"
import { RefreshCw, Zap, CheckCircle, AlertCircle, Clock, Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

interface SyncStatus {
  source: string
  status: "syncing" | "completed" | "error" | "pending"
  progress: number
  lastSync: string
  recordsProcessed: number
  errors?: string[]
}

const dataSources = [
  { id: "news-api", name: "News API", category: "news" },
  { id: "mediastack", name: "MediaStack", category: "news" },
  { id: "gnews", name: "GNews", category: "news" },
  { id: "tavily", name: "Tavily Search", category: "search" },
  { id: "serpapi", name: "SerpAPI", category: "search" },
  { id: "alpha-vantage", name: "Alpha Vantage", category: "financial" },
  { id: "financial-prep", name: "Financial Modeling Prep", category: "financial" },
  { id: "gemini", name: "Google Gemini AI", category: "ai" },
]

export function RealTimeSync() {
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([])
  const [isGlobalSync, setIsGlobalSync] = useState(false)
  const [lastGlobalSync, setLastGlobalSync] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize sync statuses
    setSyncStatuses(
      dataSources.map((source) => ({
        source: source.id,
        status: "pending",
        progress: 0,
        lastSync: "Never",
        recordsProcessed: 0,
      })),
    )

    // Check for existing sync status
    fetchSyncStatus()
  }, [])

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/agent/sync")
      if (response.ok) {
        const data = await response.json()
        if (data.statuses) {
          setSyncStatuses(data.statuses)
          setLastGlobalSync(data.lastGlobalSync)
        }
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error)
    }
  }

  const startGlobalSync = async () => {
    setIsGlobalSync(true)

    try {
      const response = await fetch("/api/agent/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sources: dataSources.map((s) => s.id),
          market_domain: "technology",
          sync_type: "full",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start sync")
      }

      toast({
        title: "Sync Started",
        description: "Real-time data synchronization has begun.",
      })

      // Simulate sync progress
      simulateSyncProgress()
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to start data synchronization.",
        variant: "destructive",
      })
      setIsGlobalSync(false)
    }
  }

  const simulateSyncProgress = () => {
    const updateInterval = setInterval(() => {
      setSyncStatuses((prev) =>
        prev.map((status) => {
          if (status.status === "pending") {
            return { ...status, status: "syncing", progress: 10 }
          }
          if (status.status === "syncing" && status.progress < 100) {
            const newProgress = Math.min(status.progress + Math.random() * 20, 100)
            const newStatus = newProgress === 100 ? "completed" : "syncing"
            return {
              ...status,
              progress: newProgress,
              status: newStatus,
              recordsProcessed: Math.floor(newProgress * 10),
              lastSync: newStatus === "completed" ? new Date().toLocaleString() : status.lastSync,
            }
          }
          return status
        }),
      )
    }, 1000)

    // Stop simulation after all sources complete
    setTimeout(() => {
      clearInterval(updateInterval)
      setIsGlobalSync(false)
      setLastGlobalSync(new Date().toLocaleString())
      toast({
        title: "Sync Completed",
        description: "All data sources have been synchronized successfully.",
      })
    }, 15000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-neon-green" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-neon-pink" />
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-neon-blue animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-neon-green/20 text-neon-green border-neon-green/50",
      error: "bg-neon-pink/20 text-neon-pink border-neon-pink/50",
      syncing: "bg-neon-blue/20 text-neon-blue border-neon-blue/50",
      pending: "bg-gray-500/20 text-gray-400 border-gray-500/50",
    }

    return (
      <Badge className={`${variants[status as keyof typeof variants]} border text-xs`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const completedSources = syncStatuses.filter((s) => s.status === "completed").length
  const totalSources = syncStatuses.length
  const overallProgress = totalSources > 0 ? (completedSources / totalSources) * 100 : 0

  return (
    <Card className="bg-dark-card border-dark-border">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-neon-blue" />
          Real-Time Data Synchronization
        </CardTitle>
        <CardDescription className="text-gray-400">
          Monitor and control data collection from all configured sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Sync Controls */}
        <div className="flex items-center justify-between p-4 border border-dark-border rounded-lg bg-dark-bg/50">
          <div className="space-y-1">
            <h4 className="text-white font-medium">Global Synchronization</h4>
            <p className="text-sm text-gray-400">
              {lastGlobalSync ? `Last sync: ${lastGlobalSync}` : "No recent synchronization"}
            </p>
          </div>
          <Button
            onClick={startGlobalSync}
            disabled={isGlobalSync}
            className="bg-neon-blue/20 border border-neon-blue/50 text-neon-blue hover:bg-neon-blue/30"
          >
            {isGlobalSync ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </div>

        {/* Overall Progress */}
        {isGlobalSync && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white">Overall Progress</span>
              <span className="text-sm text-gray-400">
                {completedSources}/{totalSources} sources
              </span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-dark-bg" />
          </div>
        )}

        {/* Individual Source Status */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Data Sources</h4>
          <div className="grid gap-3">
            {syncStatuses.map((syncStatus, index) => {
              const source = dataSources.find((s) => s.id === syncStatus.source)
              return (
                <div
                  key={syncStatus.source}
                  className="flex items-center justify-between p-3 border border-dark-border rounded-lg bg-dark-bg/30"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(syncStatus.status)}
                    <div>
                      <h5 className="text-white text-sm font-medium">{source?.name}</h5>
                      <p className="text-xs text-gray-400">
                        {syncStatus.recordsProcessed > 0 && `${syncStatus.recordsProcessed} records processed`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {syncStatus.status === "syncing" && (
                      <div className="w-20">
                        <Progress value={syncStatus.progress} className="h-1 bg-dark-bg" />
                      </div>
                    )}
                    {getStatusBadge(syncStatus.status)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sync Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-dark-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-green">{completedSources}</p>
            <p className="text-xs text-gray-400">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-blue">
              {syncStatuses.filter((s) => s.status === "syncing").length}
            </p>
            <p className="text-xs text-gray-400">Syncing</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-pink">
              {syncStatuses.filter((s) => s.status === "error").length}
            </p>
            <p className="text-xs text-gray-400">Errors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-neon-purple">
              {syncStatuses.reduce((acc, s) => acc + s.recordsProcessed, 0)}
            </p>
            <p className="text-xs text-gray-400">Total Records</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
