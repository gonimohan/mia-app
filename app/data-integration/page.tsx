"use client"

import { useState, useEffect } from "react" // Added useEffect
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
  Loader2, // For loading state
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
  // DialogTrigger, // Manual control for dialogs
  DialogClose, // For cancel buttons
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider" // For getting user token
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // For client-side Supabase
import { useToast } from "@/hooks/use-toast" // For notifications


import { APIKeyManager } from "@/components/api-key-manager"
import { RealTimeSync } from "@/components/real-time-sync"

interface DataSource {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error" | string; // Allow string for flexibility from backend
  last_sync?: string | null; // Made optional to match backend
  config: Record<string, any>;
  description?: string | null;
  category?: "news" | "financial" | "search" | "ai" | string | null; // Allow string
  user_id?: string; // From backend
  created_at?: string;
  updated_at?: string;
}

// mockDataSources removed

export default function DataIntegrationPage() {
  const { toast } = useToast();
  const supabase = createClientComponentClient(); // Initialize Supabase client

  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for Add/Edit Dialog
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<DataSource | null>(null);
  const [currentFormData, setCurrentFormData] = useState({
    name: "",
    type: "api",
    description: "",
    category: "",
    // For config, we'll handle 'endpoint' and 'apiKey' as special cases for now
    // based on the existing form, but ideally, config should be more flexible.
    endpoint: "",
    apiKey: "",
    // Add other common config fields if necessary, or a general JSON input for config
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  // State for Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingSourceId, setDeletingSourceId] = useState<string | null>(null);

  // State for testing connection
  const [testingSourceId, setTestingSourceId] = useState<string | null>(null);


  const getAuthToken = async () => {
    const session = await supabase.auth.getSession();
    return session.data.session?.access_token;
  };

  const fetchDataSources = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Authentication token not found.");

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/data-sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch data sources: ${response.statusText}`);
      const result = await response.json();
      setDataSources(result as DataSource[]);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Could not fetch data sources.", variant: "destructive" });
      setDataSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (sourceId: string) => {
    setTestingSourceId(sourceId);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast({ title: "Authentication Error", description: "Not authenticated.", variant: "destructive" });
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/data-sources/${sourceId}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const responseData = await response.json();

      if (!response.ok) { // Handles HTTP errors like 500, 404, 403 from the test endpoint itself
        throw new Error(responseData.detail || `API error: ${response.status}`);
      }

      // response.ok is true, now check test_successful from responseData
      if (responseData.test_successful) {
        toast({
          title: "Connection Test Successful",
          description: `Successfully connected to ${responseData.tested_service_type}. Message: ${responseData.message}`,
          variant: "default", // Or a success variant if you have one
        });
      } else {
        toast({
          title: "Connection Test Failed",
          description: `Failed to connect to ${responseData.tested_service_type}. Reason: ${responseData.message}`,
          variant: "destructive",
        });
      }
      fetchDataSources(); // Refresh data sources as status might have changed
    } catch (error: any) {
      console.error("Test connection error:", error);
      toast({
        title: "Connection Test Error",
        description: error.message || "An unexpected error occurred while testing the connection.",
        variant: "destructive",
      });
    } finally {
      setTestingSourceId(null);
    }
  };

  useEffect(() => {
    fetchDataSources();
  }, []);


  const handleOpenAddDialog = () => {
    setEditingSource(null);
    setCurrentFormData({ name: "", type: "api", description: "", category: "", endpoint: "", apiKey: "" });
    setIsModifyDialogOpen(true);
  };

  const handleOpenEditDialog = (source: DataSource) => {
    setEditingSource(source);
    setCurrentFormData({
      name: source.name,
      type: source.type,
      description: source.description || "",
      category: source.category || "",
      endpoint: source.config?.endpoint || "",
      apiKey: source.config?.apiKey || "",
    });
    setIsModifyDialogOpen(true);
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    const token = await getAuthToken();
    if (!token) {
      toast({ title: "Authentication Error", description: "Not authenticated.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    const payload: Partial<DataSource> & { config: Record<string, any> } = {
      name: currentFormData.name,
      type: currentFormData.type,
      description: currentFormData.description || null,
      category: currentFormData.category || null,
      config: {
        endpoint: currentFormData.endpoint,
        // apiKey should ideally be handled more securely, e.g. never re-fetched to client
        // For updates, if apiKey is not changed, don't send it or send a placeholder
        // For this subtask, we'll send it if provided.
        ...(currentFormData.apiKey && { apiKey: currentFormData.apiKey }),
      },
    };

    // If it's an edit and API key is not re-entered, we might not want to overwrite it with an empty string.
    // However, the backend PUT is designed for partial updates, so sending an empty apiKey if it was cleared is fine.
    // Or, we can choose not to include apiKey in config if currentFormData.apiKey is empty.
    // For now, if apiKey field is empty, it means user wants to clear/not set it if it's a new source.
    // If editing, and apiKey is not touched, it's tricky without knowing original config structure well.
    // The current setup implies apiKey is part of config.

    const url = editingSource
      ? `${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/data-sources/${editingSource.id}`
      : `${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/data-sources`;
    const method = editingSource ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Failed to save data source.");

      toast({ title: "Success", description: `Data source ${editingSource ? 'updated' : 'added'} successfully.` });
      fetchDataSources(); // Refresh list
      setIsModifyDialogOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Could not save data source.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (sourceId: string) => {
    setDeletingSourceId(sourceId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingSourceId) return;
    setIsSubmitting(true); // Use same submitting state for delete dialog
    const token = await getAuthToken();
    if (!token) {
      toast({ title: "Authentication Error", description: "Not authenticated.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/data-sources/${deletingSourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null); // Try to parse error
        throw new Error(result?.detail || `Failed to delete data source. Status: ${response.status}`);
      }
      toast({ title: "Success", description: "Data source deleted successfully." });
      fetchDataSources(); // Refresh list
      setIsDeleteDialogOpen(false);
      setDeletingSourceId(null);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Error", description: error.message || "Could not delete data source.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };


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

  // handleAddSource is replaced by handleFormSubmit

  const getSourceIcon = (type: string, category?: string | null) => { // category can be null
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
          {/* Add New Data Source Button - Triggers Dialog */}
          <Button
            onClick={handleOpenAddDialog}
            className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30 hover:shadow-neon-green/50 hover:shadow-lg transition-all duration-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Data Source
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 flex-col gap-6 p-6">
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-neon-blue animate-spin" />
            <p className="ml-2 text-white">Loading data sources...</p>
          </div>
        )}
        {!isLoading && (
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
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-dark-bg" onClick={() => handleOpenEditDialog(source)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-neon-pink hover:bg-neon-pink/10"
                          onClick={() => handleOpenDeleteDialog(source.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-400 mb-2">{source.description || "No description."}</div>
                    <div className="text-xs text-gray-500 mb-2">Category: {source.category || "N/A"}</div>
                     <div className="text-xs text-gray-500 mb-4 break-all">Config: {JSON.stringify(source.config)}</div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(source.status)}
                          <span>Status: {source.status}</span>
                        </div>
                        <div>Last Sync: {source.last_sync ? new Date(source.last_sync).toLocaleString() : "Never"}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                          onClick={() => handleTestConnection(source.id)}
                          disabled={testingSourceId === source.id}
                        >
                          {testingSourceId === source.id ? (
                            <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4 mr-1.5" />
                          )}
                          {testingSourceId === source.id ? "Testing..." : "Test Connection"}
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
            {/* Pass the live dataSources state to the APIKeyManager */}
            <APIKeyManager dataSources={dataSources} />
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
        )} {/* End of !isLoading condition */}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
        <DialogContent className="bg-dark-card border-dark-border text-white">
          <DialogHeader>
            <DialogTitle className="text-neon-green">
              {editingSource ? "Edit Data Source" : "Add New Data Source"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingSource ? "Update the details of your data source." : "Configure a new data source."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="sourceName">Name</Label>
              <Input id="sourceName" value={currentFormData.name} onChange={(e) => setCurrentFormData({...currentFormData, name: e.target.value})} className="bg-dark-bg border-dark-border" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sourceType">Type</Label>
              <Select value={currentFormData.type} onValueChange={(value) => setCurrentFormData({...currentFormData, type: value })}>
                <SelectTrigger className="bg-dark-bg border-dark-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                  <SelectItem value="website_scrape">Website Scrape</SelectItem>
                  <SelectItem value="file_upload">File Upload</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="llm">LLM Provider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sourceDescription">Description</Label>
              <Input id="sourceDescription" value={currentFormData.description} onChange={(e) => setCurrentFormData({...currentFormData, description: e.target.value})} className="bg-dark-bg border-dark-border" />
            </div>
             <div className="grid gap-2">
              <Label htmlFor="sourceCategory">Category</Label>
              <Select value={currentFormData.category} onValueChange={(value) => setCurrentFormData({...currentFormData, category: value })}>
                <SelectTrigger className="bg-dark-bg border-dark-border"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent className="bg-dark-card border-dark-border">
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="search">Search/Crawling</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="competitor_intel">Competitor Intel</SelectItem>
                  <SelectItem value="industry_reports">Industry Reports</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sourceEndpoint">Config: Endpoint URL</Label>
              <Input id="sourceEndpoint" value={currentFormData.endpoint} onChange={(e) => setCurrentFormData({...currentFormData, endpoint: e.target.value})} className="bg-dark-bg border-dark-border" placeholder="e.g., https://api.example.com/v1" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sourceApiKey">Config: API Key (optional)</Label>
              <Input id="sourceApiKey" type="password" value={currentFormData.apiKey} onChange={(e) => setCurrentFormData({...currentFormData, apiKey: e.target.value})} className="bg-dark-bg border-dark-border" />
            </div>
            {/* TODO: Add more fields for a flexible config object if needed, or a JSON editor */}
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-dark-bg">Cancel</Button></DialogClose>
            <Button onClick={handleFormSubmit} disabled={isSubmitting} className="bg-neon-green/80 hover:bg-neon-green/70 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingSource ? "Save Changes" : "Add Source"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-dark-card border-dark-border text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-neon-pink">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this data source? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-dark-bg">Cancel</Button></DialogClose>
            <Button onClick={handleConfirmDelete} disabled={isSubmitting} variant="destructive" className="bg-neon-pink hover:bg-neon-pink/80">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </SidebarInset>
  )
}
