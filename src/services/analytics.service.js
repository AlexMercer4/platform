import axiosInstance from '@/lib/axiosInstance';

export const analyticsService = {
  // Get appointment analytics
  getAppointmentAnalytics: async (filters = {}) => {
    const response = await axiosInstance.get('/analytics/appointments', { params: filters });
    return response.data;
  },

  // Get student analytics
  getStudentAnalytics: async (filters = {}) => {
    const response = await axiosInstance.get('/analytics/students', { params: filters });
    return response.data;
  }
};