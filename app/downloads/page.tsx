"use client"

import { useState } from "react"
import { Download, FileText, ImageIcon, Database, Archive, Calendar, Search, Filter } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DownloadItem {
  id: string
  name: string
  type: "report" | "data" | "chart" | "analysis"
  format: "pdf" | "csv" | "json" | "png" | "xlsx"
  size: string
  createdAt: string
  description: string
  category: string
  downloadCount: number
}

const mockDownloads: DownloadItem[] = [
  {
    id: "1",
    name: "Market Intelligence Report - EdTech",
    type: "report",
    format: "pdf",
    size: "2.4 MB",
    createdAt: "2024-01-15",
    description: "Comprehensive market analysis for EdTech sector",
    category: "Reports",
    downloadCount: 15,
  },
  {
    id: "2",
    name: "Customer Insights Data",
    type: "data",
    format: "csv",
    size: "856 KB",
    createdAt: "2024-01-15",
    description: "Customer segmentation and behavior data",
    category: "Data",
    downloadCount: 8,
  },
  {
    id: "3",
    name: "Market Trends Chart",
    type: "chart",
    format: "png",
    size: "1.2 MB",
    createdAt: "2024-01-14",
    description: "Visual representation of market trends",
    category: "Charts",
    downloadCount: 12,
  },
  {
    id: "4",
    name: "Competitor Analysis",
    type: "analysis",
    format: "json",
    size: "445 KB",
    createdAt: "2024-01-14",
    description: "Detailed competitor landscape analysis",
    category: "Analysis",
    downloadCount: 6,
  },
  {
    id: "5",
    name: "Financial Data Export",
    type: "data",
    format: "xlsx",
    size: "3.1 MB",
    createdAt: "2024-01-13",
    description: "Financial metrics and KPI data",
    category: "Data",
    downloadCount: 22,
  },
]

export default function DownloadsPage() {
  const [downloads, setDownloads] = useState<DownloadItem[]>(mockDownloads)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedFormat, setSelectedFormat] = useState("all")

  const filteredDownloads = downloads.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesFormat = selectedFormat === "all" || item.format === selectedFormat

    return matchesSearch && matchesCategory && matchesFormat
  })

  const getFileIcon = (format: string) => {
    switch (format) {
      case "pdf":
      case "xlsx":
        return <FileText className="w-5 h-5 text-neon-pink" />
      case "csv":
      case "json":
        return <Database className="w-5 h-5 text-neon-blue" />
      case "png":
        return <ImageIcon className="w-5 h-5 text-neon-green" />
      default:
        return <Archive className="w-5 h-5 text-gray-400" />
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      report: "bg-neon-purple/20 text-neon-purple border-neon-purple/50",
      data: "bg-neon-blue/20 text-neon-blue border-neon-blue/50",
      chart: "bg-neon-green/20 text-neon-green border-neon-green/50",
      analysis: "bg-neon-orange/20 text-neon-orange border-neon-orange/50",
    }

    return (
      <Badge className={`${variants[type as keyof typeof variants]} border`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const handleDownload = (item: DownloadItem) => {
    // Simulate download
    console.log(`Downloading ${item.name}`)

    // Update download count
    setDownloads((prev) => prev.map((d) => (d.id === item.id ? { ...d, downloadCount: d.downloadCount + 1 } : d)))
  }

  const categories = ["all", "reports", "data", "charts", "analysis"]
  const formats = ["all", "pdf", "csv", "json", "png", "xlsx"]

  return (
    <SidebarInset className="bg-dark-bg">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-dark-border bg-dark-card/50 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-white hover:bg-dark-card" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-dark-border" />
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-neon-green" />
          <h1 className="text-lg font-semibold text-white">Downloads</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Filters */}
        <Card className="bg-dark-card border-dark-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="w-5 h-5 text-neon-blue" />
              Filter Downloads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search downloads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-dark-bg border-dark-border text-white"
                  />
                </div>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40 bg-dark-bg border-dark-border text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-32 bg-dark-bg border-dark-border text-white">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  {formats.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Downloads List */}
        <Tabs defaultValue="grid" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-dark-card border border-dark-border mb-6">
            <TabsTrigger
              value="grid"
              className="data-[state=active]:bg-neon-blue/20 data-[state=active]:text-neon-blue"
            >
              Grid View
            </TabsTrigger>
            <TabsTrigger
              value="list"
              className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green"
            >
              List View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDownloads.map((item) => (
                <Card
                  key={item.id}
                  className="bg-dark-card border-dark-border hover:border-opacity-50 transition-all duration-300"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-dark-bg">{getFileIcon(item.format)}</div>
                        <div className="flex-1">
                          <CardTitle className="text-white text-sm line-clamp-2">{item.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            {getTypeBadge(item.type)}
                            <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                              {item.format.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {item.createdAt}
                      </div>
                      <span>{item.size}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Downloaded {item.downloadCount} times</span>
                      <Button
                        size="sm"
                        onClick={() => handleDownload(item)}
                        className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list" className="space-y-4">
            <div className="space-y-2">
              {filteredDownloads.map((item) => (
                <Card key={item.id} className="bg-dark-card border-dark-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-dark-bg">{getFileIcon(item.format)}</div>

                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate">{item.name}</h3>
                          <p className="text-sm text-gray-400 truncate">{item.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {getTypeBadge(item.type)}
                          <Badge variant="outline" className="border-gray-600 text-gray-400">
                            {item.format.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-white">{item.size}</p>
                          <p className="text-xs text-gray-400">{item.createdAt}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">{item.downloadCount} downloads</p>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(item)}
                            className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-blue/20">
                  <FileText className="w-6 h-6 text-neon-blue" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{downloads.length}</p>
                  <p className="text-sm text-gray-400">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-green/20">
                  <Download className="w-6 h-6 text-neon-green" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {downloads.reduce((acc, item) => acc + item.downloadCount, 0)}
                  </p>
                  <p className="text-sm text-gray-400">Total Downloads</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-purple/20">
                  <Archive className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{new Set(downloads.map((d) => d.format)).size}</p>
                  <p className="text-sm text-gray-400">File Formats</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-neon-orange/20">
                  <Calendar className="w-6 h-6 text-neon-orange" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {downloads.filter((d) => d.createdAt === "2024-01-15").length}
                  </p>
                  <p className="text-sm text-gray-400">Recent Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  )
}
