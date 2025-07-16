import axiosInstance from '@/lib/axiosInstance';

export const appointmentsService = {
  // Get appointments (filtered by user role)
  getAppointments: async (filters = {}) => {
    const response = await axiosInstance.get('/appointments', { params: filters });
    return response.data;
  },

  // Create new appointment
  createAppointment: async (appointmentData) => {
    const response = await axiosInstance.post('/appointments', appointmentData);
    return response.data;
  },

  // Update appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    const response = await axiosInstance.put(`/appointments/${appointmentId}`, appointmentData);
    return response.data;
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId) => {
    const response = await axiosInstance.delete(`/appointments/${appointmentId}`);
    return response.data;
  },

  // Update appointment status
  updateAppointmentStatus: async (appointmentId, status) => {
    const response = await axiosInstance.patch(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  }
};