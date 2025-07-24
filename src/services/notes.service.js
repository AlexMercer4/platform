import axiosInstance from '@/lib/axiosInstance';

export const notesService = {
  // Get student notes
  getStudentNotes: async (studentId) => {
    try {
      const response = await axiosInstance.get(`/students/${studentId}/notes`);
      // Ensure we return data in a consistent format
      return response.data && response.data.data ? 
        { data: response.data.data } : 
        { data: [] };
    } catch (error) {
      console.error("Error fetching notes:", error);
      return { data: [] };
    }
  },

  // Create new note
  createNote: async (studentId, noteData) => {
    try {
      const response = await axiosInstance.post(`/students/${studentId}/notes`, noteData);
      return response.data;
    } catch (error) {
      console.error("Error creating note:", error);
      throw error;
    }
  },

  // Update note
  updateNote: async (noteId, noteData) => {
    try {
      const response = await axiosInstance.put(`/notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  },

  // Delete note
  deleteNote: async (noteId) => {
    try {
      const response = await axiosInstance.delete(`/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting note:", error);
      throw error;
    }
  }
};