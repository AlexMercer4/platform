import axiosInstance from '@/lib/axiosInstance';

export const messagesService = {
  // Get user's conversations
  getConversations: async () => {
    const response = await axiosInstance.get('/conversations');
    return response.data;
  },

  // Get conversation messages
  getMessages: async (conversationId) => {
    const response = await axiosInstance.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },

  // Send message
  sendMessage: async (conversationId, messageData) => {
    const response = await axiosInstance.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data;
  },

  // Start new conversation
  startConversation: async (participantId) => {
    const response = await axiosInstance.post('/conversations', { participantId });
    return response.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await axiosInstance.patch(`/messages/${messageId}/read`);
    return response.data;
  }
};