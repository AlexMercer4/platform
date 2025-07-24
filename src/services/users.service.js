import axiosInstance from '@/lib/axiosInstance';

export const usersService = {
  // Get all users with filters (Chairperson only)
  getUsers: async (filters = {}) => {
    const response = await axiosInstance.get('/users', { params: filters });
    return response.data.data || response.data; // Handle both formats
  },

  // Create new student (Chairperson only)
  createStudent: async (studentData) => {
    const response = await axiosInstance.post('/users/students', studentData);
    return response.data;
  },

  // Create new counselor (Chairperson only)
  createCounselor: async (counselorData) => {
    const response = await axiosInstance.post('/users/counselors', counselorData);
    return response.data;
  },

  // Update user (Chairperson only)
  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Delete user (Chairperson only)
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/users/${userId}`);
    return response.data;
  },

  // Toggle user active status (Chairperson only)
  toggleUserStatus: async (userId) => {
    const response = await axiosInstance.patch(`/users/${userId}/status`);
    return response.data.data || response.data; // Handle both formats
  },

  // Assign counselor to student (Chairperson only)
  assignCounselorToStudent: async (studentId, counselorId) => {
    const response = await axiosInstance.put(`/users/${studentId}`, {
      assignedCounselorId: counselorId || null
    });
    return response.data;
  }
};