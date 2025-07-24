import axiosInstance from '@/lib/axiosInstance';

export const studentsService = {
  // Get students list (for counselors/chairperson)
  getStudents: async (filters = {}) => {
    const response = await axiosInstance.get('/students', { params: filters });
    return response.data;
  },

  // Get counselor's assigned students (for appointment booking)
  getAssignedStudents: async () => {
    const response = await axiosInstance.get('/students/assigned');
    return response.data;
  },

  // Get student details
  getStudentById: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}`);
    return response.data.data || response.data;
  },

  // Update student profile
  updateStudent: async (studentId, studentData) => {
    const response = await axiosInstance.put(`/students/${studentId}`, studentData);
    return response.data;
  },

  // Get student's appointments
  getStudentAppointments: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}/appointments`);
    return response.data;
  },

  // Get student's notes
  getStudentNotes: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}/notes`);
    return response.data;
  }
};