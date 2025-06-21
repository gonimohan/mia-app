"use client"

import React, { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { 
  Upload, 
  File, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  Download,
  Trash2,
  Eye,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

interface UploadedFile {
  file_id: string
  filename: string
  file_type: string
  file_size: number
  processing_status: string
  upload_timestamp: string
  processed_data?: any
  ai_analysis?: any
}

interface FileUploadManagerProps {
  onFileAnalyzed?: (fileData: UploadedFile) => void
}

export function FileUploadManager({ onFileAnalyzed }: FileUploadManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const { toast } = useToast()
  const { user, supabaseClient } = useAuth()

  const getAuthToken = async () => {
    if (!supabaseClient) return null
    const { data: { session } } = await supabaseClient.auth.getSession()
    return session?.access_token
  }

  const fetchUploadedFiles = async () => {
    if (!user) return
    
    setIsLoadingFiles(true)
    try {
      const token = await getAuthToken()
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in to view files.",
          variant: "destructive"
        })
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/api/files`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`)
      }

      const result = await response.json()
      setUploadedFiles(result.files || [])
    } catch (error: any) {
      console.error("Failed to fetch files:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load uploaded files.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upload files.",
        variant: "destructive"
      })
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.pdf', '.txt', '.md']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: `Please upload files with extensions: ${allowedTypes.join(', ')}`,
        variant: "destructive"
      })
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB.",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const token = await getAuthToken()
      if (!token) {
        throw new Error("Authentication token not available")
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('analysis_type', 'comprehensive')

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || `Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      toast({
        title: "Upload Successful",
        description: `${file.name} has been processed successfully.`
      })

      // Add to uploaded files list
      setUploadedFiles(prev => [result, ...prev])
      
      // Notify parent component
      if (onFileAnalyzed) {
        onFileAnalyzed(result)
      }

    } catch (error: any) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [user, onFileAnalyzed, toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    },
    multiple: false,
    disabled: uploading
  })

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case '.csv':
        return <Table className="w-5 h-5 text-neon-green" />
      case '.xlsx':
      case '.xls':
        return <FileSpreadsheet className="w-5 h-5 text-neon-blue" />
      case '.pdf':
        return <File className="w-5 h-5 text-neon-pink" />
      case '.txt':
      case '.md':
        return <FileText className="w-5 h-5 text-neon-orange" />
      default:
        return <File className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-neon-green/20 text-neon-green border-neon-green/50">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        )
      case 'processing':
        return (
          <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/50">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Processing
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-neon-pink/20 text-neon-pink border-neon-pink/50">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
            Unknown
          </Badge>
        )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleViewFile = async (fileId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/api/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch file details')
      }

      const fileDetails = await response.json()
      
      // For now, show a simple alert with file details
      // In a real app, you'd open a modal with detailed view
      toast({
        title: "File Details",
        description: `${fileDetails.filename} - ${formatFileSize(fileDetails.file_size)}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load file details.",
        variant: "destructive"
      })
    }
  }

  const handleDeleteFile = async (fileId: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return

    try {
      const token = await getAuthToken()
      if (!token) return

      // Note: Delete endpoint would need to be implemented in backend
      toast({
        title: "Delete Feature",
        description: "File deletion will be implemented in the next update.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete file.",
        variant: "destructive"
      })
    }
  }

  const handleGenerateReport = async (fileId: string) => {
    try {
      const token = await getAuthToken()
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_PYTHON_AGENT_API_BASE_URL}/api/files/${fileId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          file_id: fileId,
          analysis_type: 'comprehensive'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const result = await response.json()
      
      toast({
        title: "Report Generated",
        description: "Analysis report has been generated successfully.",
      })
      
      // Refresh file list to get updated analysis
      fetchUploadedFiles()
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate report.",
        variant: "destructive"
      })
    }
  }

  // Load files on component mount
  React.useEffect(() => {
    if (user) {
      fetchUploadedFiles()
    }
  }, [user])

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-neon-blue" />
            File Upload & Analysis
          </CardTitle>
          <CardDescription className="text-gray-400">
            Upload CSV, Excel, PDF, or text files for AI-powered market intelligence analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-neon-blue bg-neon-blue/10'
                : 'border-gray-600 hover:border-neon-blue/50 hover:bg-dark-bg/50'
            } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 text-neon-blue mx-auto animate-spin" />
                <div className="space-y-2">
                  <p className="text-white font-medium">Uploading and processing...</p>
                  <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                  <p className="text-sm text-gray-400">{uploadProgress}% complete</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-white font-medium mb-2">
                    {isDragActive ? 'Drop your file here' : 'Drag & drop a file here, or click to select'}
                  </p>
                  <p className="text-sm text-gray-400">
                    Supports CSV, Excel (.xlsx, .xls), PDF, and text files (max 10MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-neon-blue/50 text-neon-blue hover:bg-neon-blue/10"
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      <Card className="bg-dark-card border-dark-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <File className="w-5 h-5 text-neon-green" />
              Uploaded Files
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUploadedFiles}
              disabled={isLoadingFiles}
              className="border-gray-600 text-gray-400 hover:bg-dark-bg"
            >
              {isLoadingFiles ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <File className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No files uploaded yet</p>
              <p className="text-sm">Upload your first file to get started with AI analysis.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.file_id}
                  className="flex items-center justify-between p-4 border border-dark-border rounded-lg bg-dark-bg/50 hover:bg-dark-bg/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getFileIcon(file.file_type)}
                    <div>
                      <h4 className="text-white font-medium">{file.filename}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>{new Date(file.upload_timestamp).toLocaleDateString()}</span>
                        {getStatusBadge(file.processing_status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      onClick={() => handleViewFile(file.file_id)}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-neon-blue"
                      onClick={() => handleGenerateReport(file.file_id)}
                      title="Generate Report"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-neon-green"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-neon-pink"
                      onClick={() => handleDeleteFile(file.file_id, file.filename)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}