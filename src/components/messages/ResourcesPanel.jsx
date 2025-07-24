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
  FileType2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/services/upload.service";

export default function ResourcesPanel({ conversationId, currentUserId }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch shared resources for the conversation
  const { 
    data: resources = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: ['resources', conversationId],
    queryFn: () => uploadService.getConversationFiles(conversationId),
    enabled: !!conversationId,
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
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

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
    
    // Reset file input
    event.target.value = null;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load resources</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['resources', conversationId] })}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium">Shared Resources</h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Button 
            onClick={() => document.getElementById('file-upload').click()}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload File
          </Button>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No shared files yet</p>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1">
          <ul className="space-y-3">
            {resources.map((file) => (
              <li 
                key={file.id} 
                className="border rounded-md p-3 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(file.mimeType)}
                  <div>
                    <p className="font-medium text-gray-900">{file.originalName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>Shared by {file.uploadedBy}</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDownload(file.id, file.originalName)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {file.uploadedById === currentUserId && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}