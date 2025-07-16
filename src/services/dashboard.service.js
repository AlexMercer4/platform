import axiosInstance from '@/lib/axiosInstance';

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await axiosInstance.get('/dashboard/stats');
    return response.data;
  },

  // Get recent appointments
  getRecentAppointments: async (limit = 5) => {
    const response = await axiosInstance.get('/dashboard/appointments', { params: { limit } });
    return response.data;
  },

  // Get recent messages
  getRecentMessages: async (limit = 5) => {
    const response = await axiosInstance.get('/dashboard/messages', { params: { limit } });
    return response.data;
  }
};