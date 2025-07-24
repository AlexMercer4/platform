import axiosInstance from '@/lib/axiosInstance';

export const messagesService = {
  // Get user's conversations
  getConversations: async () => {
    const response = await axiosInstance.get('/conversations');
    return response.data.data || [];
  },

  // Get conversation messages
  getMessages: async (conversationId) => {
    const response = await axiosInstance.get(`/conversations/${conversationId}/messages`);
    return response.data.data || [];
  },

  // Send message
  sendMessage: async (conversationId, messageData) => {
    const response = await axiosInstance.post(`/conversations/${conversationId}/messages`, messageData);
    return response.data.data;
  },

  // Start new conversation
  startConversation: async (participantId, initialMessage) => {
    const response = await axiosInstance.post('/conversations', { 
      participantId,
      initialMessage
    });
    return response.data.data;
  },

  // Mark message as read
  markAsRead: async (messageId) => {
    const response = await axiosInstance.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  // Get assigned users or search for users to message
  searchUsers: async (search = '') => {
    try {
      const response = await axiosInstance.get('/messages/search-users', {
        params: { search }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }
};