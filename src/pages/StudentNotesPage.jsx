import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  User,
  Loader2,
  AlertCircle,
  Filter,
  Lock,
  Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { notesService } from "@/services/notes.service";
import { studentsService } from "@/services/students.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function StudentNotesPage() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterPrivacy, setFilterPrivacy] = useState("all");
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Form state
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);

  const noteCategories = [
    { value: "academic", label: "Academic Progress" },
    { value: "behavioral", label: "Behavioral Observation" },
    { value: "career", label: "Career Guidance" },
    { value: "personal", label: "Personal Development" },
    { value: "attendance", label: "Attendance & Engagement" },
    { value: "general", label: "General Notes" },
  ];

  // Fetch student data
  const { 
    data: studentData, 
    isLoading: isLoadingStudent,
    error: studentError
  } = useQuery({
    queryKey: ['student', studentId],
    queryFn: () => studentsService.getStudentById(studentId),
    onError: (error) => {
      toast.error(`Failed to load student data: ${error.message}`);
    }
  });

  // Fetch student notes
  const { 
    data, 
    isLoading: isLoadingNotes,
    error: notesError
  } = useQuery({
    queryKey: ['studentNotes', studentId],
    queryFn: () => notesService.getStudentNotes(studentId),
    onError: (error) => {
      toast.error(`Failed to load student notes: ${error.message}`);
    }
  });
  
  // Ensure notes is always an array
  console.log("Notes data received:", data);
  const notes = Array.isArray(data?.data) ? data.data : [];

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData) => notesService.createNote(studentId, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotes', studentId] });
      toast.success("Note added successfully");
      setIsAddEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to add note: ${error.message}`);
    }
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, noteData }) => notesService.updateNote(noteId, noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotes', studentId] });
      toast.success("Note updated successfully");
      setIsAddEditDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update note: ${error.message}`);
    }
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => notesService.deleteNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentNotes', studentId] });
      toast.success("Note deleted successfully");
      setIsDeleteDialogOpen(false);
      setNoteToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete note: ${error.message}`);
    }
  });

  // Filter notes based on search, category, and privacy
  const filteredNotes = Array.isArray(notes) ? notes.filter(note => {
    // Apply search filter
    if (searchQuery && 
        !note.content.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !note.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply category filter
    if (filterCategory !== "all" && note.category !== filterCategory) {
      return false;
    }
    
    // Apply privacy filter
    if (filterPrivacy === "private" && !note.isPrivate) {
      return false;
    }
    
    if (filterPrivacy === "shared" && note.isPrivate) {
      return false;
    }
    
    return true;
  }) : [];

  const handleAddNote = () => {
    setEditingNote(null);
    setNoteContent("");
    setNoteCategory("");
    setIsPrivate(true);
    setIsAddEditDialogOpen(true);
  };

  const handleEditNote = (note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteCategory(note.category);
    setIsPrivate(note.isPrivate);
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteNote = (note) => {
    setNoteToDelete(note);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !noteCategory) return;

    try {
      if (editingNote) {
        // Update existing note
        const noteData = {
          content: noteContent.trim(),
          category: noteCategory,
          isPrivate
        };
        
        updateNoteMutation.mutate({ 
          noteId: editingNote.id, 
          noteData 
        });
      } else {
        // Add new note
        const noteData = {
          category: noteCategory,
          content: noteContent.trim(),
          isPrivate
        };
        
        createNoteMutation.mutate(noteData);
      }
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  const confirmDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      deleteNoteMutation.mutate(noteToDelete.id);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const resetForm = () => {
    setNoteContent("");
    setNoteCategory("");
    setIsPrivate(true);
    setEditingNote(null);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "academic":
        return "bg-blue-100 text-blue-800";
      case "behavioral":
        return "bg-green-100 text-green-800";
      case "career":
        return "bg-purple-100 text-purple-800";
      case "personal":
        return "bg-orange-100 text-orange-800";
      case "attendance":
        return "bg-red-100 text-red-800";
      case "general":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isFormValid = noteContent.trim() && noteCategory;
  const isLoading = createNoteMutation.isPending || updateNoteMutation.isPending || deleteNoteMutation.isPending;

  // Handle loading state for student data and notes
  if (isLoadingStudent || isLoadingNotes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student notes...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (studentError || notesError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">
            {studentError?.message || notesError?.message || "Failed to load student data or notes. Please try again."}
          </p>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['student', studentId] });
              queryClient.invalidateQueries({ queryKey: ['studentNotes', studentId] });
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // If student data is not available
  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested student could not be found or you don't have permission to view their notes.
          </p>
          <Button 
            onClick={() => navigate("/students")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/students")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Students</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Notes for {studentData.name}
            </h1>
            <p className="text-gray-600 mt-2">
              {studentData.studentId} • {studentData.department} •{" "}
              {studentData.currentSemester || "N/A"}
            </p>
          </div>

          <Button
            onClick={handleAddNote}
            className="mt-4 sm:mt-0 bg-[#0056b3] hover:bg-[#004494] flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Note</span>
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {noteCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterPrivacy} onValueChange={setFilterPrivacy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Privacy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notes</SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center">
                    <Lock className="h-3.5 w-3.5 mr-2" />
                    <span>Private</span>
                  </div>
                </SelectItem>
                <SelectItem value="shared">
                  <div className="flex items-center">
                    <Globe className="h-3.5 w-3.5 mr-2" />
                    <span>Shared</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || filterCategory !== "all" || filterPrivacy !== "all"
                ? "No notes found"
                : "No notes yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || filterCategory !== "all" || filterPrivacy !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Start by adding the first note for this student"}
            </p>
            {!searchQuery && filterCategory === "all" && filterPrivacy === "all" && (
              <Button
                onClick={handleAddNote}
                className="bg-[#0056b3] hover:bg-[#004494]"
              >
                Add First Note
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getCategoryColor(note.category)}>
                        {noteCategories.find(
                          (cat) => cat.value === note.category
                        )?.label || note.category}
                      </Badge>
                      <div className="flex items-center space-x-2 text-sm">
                        {note.isPrivate ? (
                          <div className="flex items-center space-x-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                            <Lock className="h-3 w-3" />
                            <span>Private</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            <Globe className="h-3 w-3" />
                            <span>Shared</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Only show edit/delete buttons for notes created by the current user */}
                      {note.counselorId === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditNote(note)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-900 mb-4 leading-relaxed">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span className={note.counselorId === user?.id ? "font-medium text-blue-600" : ""}>
                          {note.counselorId === user?.id ? "You" : note.createdBy}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(note.createdAt)}</span>
                      </div>
                    </div>

                    {note.updatedAt !== note.createdAt && (
                      <span className="text-xs">
                        Updated: {formatDate(note.updatedAt)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Note Dialog */}
        <Dialog
          open={isAddEditDialogOpen}
          onOpenChange={setIsAddEditDialogOpen}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-[#0056b3]" />
                <span>
                  {editingNote ? "Edit Note" : "Add Note"} for{" "}
                  {studentData.name}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Note Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Note Category</Label>
                <Select value={noteCategory} onValueChange={setNoteCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select note category" />
                  </SelectTrigger>
                  <SelectContent>
                    {noteCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Note Content</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your note about the student's progress, behavior, or any observations..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500">
                  {noteContent.length}/1000 characters
                </p>
              </div>

              {/* Privacy Setting */}
              <div className="space-y-2">
                <Label>Privacy Setting</Label>
                <Select
                  value={isPrivate ? "private" : "shared"}
                  onValueChange={(value) => setIsPrivate(value === "private")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-red-600" />
                        <span>Private (Only visible to you)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="shared">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-green-600" />
                        <span>Shared (Visible to other counselors)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className={`text-xs p-2 rounded-md ${isPrivate ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                  {isPrivate
                    ? "This note will only be visible to you. Other counselors working with this student will not be able to see it."
                    : "This note will be visible to all counselors working with this student. Use this for information that should be shared with the team."}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddEditDialogOpen(false);
                  resetForm();
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveNote}
                disabled={!isFormValid || isLoading}
                className="bg-[#0056b3] hover:bg-[#004494]"
              >
                {isLoading
                  ? "Saving..."
                  : editingNote
                  ? "Update Note"
                  : "Save Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Note</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this note? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNoteToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNote}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
