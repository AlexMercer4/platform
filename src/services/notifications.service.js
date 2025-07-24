import axiosInstance from '@/lib/axiosInstance';

export const notificationService = {
  // Get user's notifications with pagination
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 10, unreadOnly = false } = params;
    const response = await axiosInstance.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  // Get count of unread notifications
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  // Mark a single notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.patch('/notifications/read-all');
    return response.data;
  },

  // Get all notifications (for "View All" page)
  getAllNotifications: async (params = {}) => {
    const { page = 1, limit = 20 } = params;
    const response = await axiosInstance.get('/notifications/all', {
      params: { page, limit }
    });
    return response.data;
  }
};