import axiosInstance from '@/lib/axiosInstance';

export const notesService = {
  // Get student notes
  getStudentNotes: async (studentId) => {
    const response = await axiosInstance.get(`/students/${studentId}/notes`);
    return response.data;
  },

  // Create new note
  createNote: async (studentId, noteData) => {
    const response = await axiosInstance.post(`/students/${studentId}/notes`, noteData);
    return response.data;
  },

  // Update note
  updateNote: async (noteId, noteData) => {
    const response = await axiosInstance.put(`/notes/${noteId}`, noteData);
    return response.data;
  },

  // Delete note
  deleteNote: async (noteId) => {
    const response = await axiosInstance.delete(`/notes/${noteId}`);
    return response.data;
  }
};