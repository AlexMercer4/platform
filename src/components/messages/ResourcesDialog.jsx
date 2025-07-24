import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileText,
  FileImage,
  File,
  Trash2,
  Upload,
  Loader2,
  FileType2,
  CloudUpload
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { uploadService } from "@/services/upload.service";

export default function ResourcesDialog({
  open,
  onOpenChange,
  conversationId,
  currentUserId
}) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch shared resources for the conversation
  const {
    data: resources = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['resources', conversationId],
    queryFn: () => uploadService.getConversationFiles(conversationId),
    enabled: !!conversationId && open,
    onError: (error) => {
      toast.error(`Failed to load resources: ${error.message}`);
    }
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: (formData) => uploadService.uploadFile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', conversationId] });
      toast.success("File uploaded successfully");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Failed to upload file: ${error.message}`);
      setIsUploading(false);
    }
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => uploadService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources', conversationId] });
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete file: ${error.message}`);
    }
  });

  // Handle file upload
  const handleFileUpload = async (files) => {
    const file = files[0]; // Handle single file for now
    if (!file) return;

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/zip', 'application/x-rar-compressed'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("File type not supported. Please upload images, documents, or archives.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId);

      uploadFileMutation.mutate(formData);
    } catch (error) {
      toast.error("Failed to upload file");
      setIsUploading(false);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event) => {
    const files = Array.from(event.target.files);
    handleFileUpload(files);
    // Reset file input
    event.target.value = null;
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  // Handle file download
  const handleDownload = async (fileId, fileName) => {
    try {
      await uploadService.downloadFile(fileId);
      toast.success(`Downloading ${fileName}`);
    } catch (error) {
      toast.error(`Failed to download file: ${error.message}`);
    }
  };

  // Handle file deletion
  const handleDelete = (fileId) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      deleteFileMutation.mutate(fileId);
    }
  };

  // Get file icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FileType2 className="h-6 w-6 text-red-500" />;
    if (fileType.includes('image')) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (fileType.includes('text') || fileType.includes('document')) return <FileText className="h-6 w-6 text-gray-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="w-[95vw] max-w-[600px] h-[85vh] sm:h-[75vh] p-0 flex flex-col overflow-hidden">
  {/* Header (non-scrollable) */}
  <DialogHeader className="px-6 py-4 border-b shrink-0">
    <DialogTitle className="text-lg sm:text-xl">Shared Resources</DialogTitle>
  </DialogHeader>

  {/* Scrollable content */}
  <div className="flex-1 min-h-0 overflow-auto px-6 py-4 space-y-6">
    
    {/* Upload Area */}
    <div
      className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${isDragOver
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        id="resources-file-upload"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar"
      />

      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-xs sm:text-sm text-gray-600">Uploading file...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <CloudUpload className={`h-6 w-6 sm:h-8 sm:w-8 mb-2 ${isDragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {isDragOver ? 'Drop file here' : 'Drag and drop a file here'}
          </p>
          <p className="text-xs text-gray-500 mb-3">or click to browse (Max 10MB)</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 text-xs sm:text-sm"
          >
            <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            Choose File
          </Button>
          <p className="text-xs text-gray-400 mt-2 hidden sm:block">
            Supports: Images, PDF, Documents, Archives
          </p>
        </div>
      )}
    </div>

    {/* File Count */}
    <p className="text-sm sm:text-base text-gray-600 font-medium">
      Shared Files ({resources.length})
    </p>

    {/* File List */}
    {isLoading ? (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-spin mx-auto mb-2" />
        <p className="text-xs sm:text-sm text-gray-500">Loading files...</p>
      </div>
    ) : error ? (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2 text-xs sm:text-sm">Failed to load resources</p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['resources', conversationId] })}
          size="sm"
          className="text-xs sm:text-sm"
        >
          Try Again
        </Button>
      </div>
    ) : resources.length === 0 ? (
      <div className="text-center py-8">
        <File className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-2 sm:mb-4" />
        <p className="text-gray-500 text-xs sm:text-sm">No shared files yet</p>
      </div>
    ) : (
      <div className="space-y-2 sm:space-y-3 pb-2">
        {resources.map((file) => (
          <div
            key={file.id}
            className="border rounded-lg p-3 sm:p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getFileIcon(file.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate text-sm sm:text-base" title={file.originalName}>
                  {file.originalName}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
                  <span>{formatFileSize(file.size)}</span>
                  <span>by {file.uploadedBy}</span>
                  <span className="hidden sm:inline">{new Date(file.createdAt).toLocaleDateString()}</span>
                  <span className="sm:hidden">
                    {new Date(file.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 ml-2 sm:ml-3 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownload(file.id, file.originalName)}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                title="Download file"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {file.uploadedById === currentUserId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(file.id)}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Delete file"
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</DialogContent>

    </Dialog>
  );
  

}