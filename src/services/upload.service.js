import axiosInstance from '@/lib/axiosInstance';

export const uploadService = {
  // Upload file attachment (single file)
  uploadFile: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add any additional metadata
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });

    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download file
  downloadFile: async (fileId) => {
    const response = await axiosInstance.get(`/files/${fileId}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await axiosInstance.delete(`/files/${fileId}`);
    return response.data;
  }
};