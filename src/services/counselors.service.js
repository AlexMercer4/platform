import axiosInstance from '@/lib/axiosInstance';

export const counselorsService = {
  // Get counselors list
  getCounselors: async (filters = {}) => {
    const response = await axiosInstance.get('/counselors', { params: filters });
    return response.data;
  },

  // Get counselor details
  getCounselorById: async (counselorId) => {
    const response = await axiosInstance.get(`/counselors/${counselorId}`);
    return response.data;
  },

  // Update counselor profile
  updateCounselor: async (counselorId, counselorData) => {
    const response = await axiosInstance.put(`/counselors/${counselorId}`, counselorData);
    return response.data;
  },

  // Get counselor's assigned students
  getCounselorStudents: async (counselorId) => {
    const response = await axiosInstance.get(`/counselors/${counselorId}/students`);
    return response.data;
  }
};