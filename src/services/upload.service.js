import axiosInstance from '@/lib/axiosInstance';

export const uploadService = {
  // Upload file to conversation
  uploadFile: async (formData) => {
    try {
      const response = await axiosInstance.post('/conversations/' + formData.get('conversationId') + '/files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  },

  // Get files for a conversation
  getConversationFiles: async (conversationId) => {
    try {
      const response = await axiosInstance.get(`/conversations/${conversationId}/files`);
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch files');
    }
  },

  // Download file
  downloadFile: async (fileId) => {
    try {
      const response = await axiosInstance.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download file');
    }
  },

  // Delete file
  deleteFile: async (fileId) => {
    try {
      const response = await axiosInstance.delete(`/files/${fileId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  }
};