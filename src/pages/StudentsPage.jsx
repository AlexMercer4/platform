import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { studentsService } from "@/services/students.service";
import { toast } from "sonner";
import StudentDetailDialog from "@/components/students/StudentDetailDialog";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [batch, setBatch] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(9); // Fixed limit for consistent grid layout
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // Fetch students data with React Query
  const { 
    data, 
    isLoading, 
    isError,
    error
  } = useQuery({
    queryKey: ['students', { search: searchQuery, department, batch, page, limit }],
    queryFn: () => studentsService.getStudents({ 
      search: searchQuery, 
      department: department === "all" ? "" : department, 
      batch: batch === "all" ? "" : batch, 
      page, 
      limit 
    }),
    keepPreviousData: true,
    onError: (err) => {
      toast.error(`Failed to load students: ${err.message}`);
    }
  });

  // Extract students and pagination data
  const students = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  const handleViewDetails = (student) => {
    setSelectedStudentId(student.id);
    setIsDetailDialogOpen(true);
  };

  const handleMessageStudent = (student) => {
    // Navigate to messages page with student ID as query parameter
    navigate(`/messages?userId=${student.id}`);
  };

  const handleViewNotes = (student) => {
    // Navigate to student notes page
    navigate(`/students/${student.id}/notes`);
  };

  const handleNextPage = () => {
    if (page < pagination.pages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const getCGPAColor = (cgpa) => {
    if (cgpa >= 3.5) return "text-green-600";
    if (cgpa >= 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-2">
            Manage and track your assigned student&apos;s progress.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students by name, ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                  <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                  <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                  <SelectItem value="Business Administration">Business Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/2">
              <Select value={batch} onValueChange={setBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                  <SelectItem value="2021">2021</SelectItem>
                  <SelectItem value="2020">2020</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Loading students...
            </h3>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error loading students
            </h3>
            <p className="text-gray-500 mb-4">
              {error?.message || "Failed to load student data"}
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Students Grid */}
        {!isLoading && !isError && students.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No students found
            </h3>
            <p className="text-gray-500">
              {searchQuery || (department !== "all") || (batch !== "all")
                ? "Try adjusting your search criteria"
                : "No students assigned yet"}
            </p>
          </div>
        ) : !isLoading && !isError && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card
                key={student.id}
                className="hover:shadow-md transition-shadow duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-[#0056b3] text-white p-2 rounded-full">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {student.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {student.studentId}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Department:</span>
                      <span className="text-gray-900">
                        {student.department}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Semester:</span>
                      <span className="text-gray-900">{student.currentSemester}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">CGPA:</span>
                      <span
                        className={`font-medium ${getCGPAColor(student.cgpa || 0)}`}
                      >
                        {student.cgpa ? student.cgpa.toFixed(2) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Session:</span>
                      <span className="text-gray-900">
                        {formatDate(student.lastSessionDate)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Sessions:</span>
                      <span className="text-gray-900">
                        {student.totalSessions}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2 mb-2">
                    <Button
                      size="sm"
                      className="bg-[#0056b3] hover:bg-[#004494] flex-1"
                      onClick={() => handleViewDetails(student)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleMessageStudent(student)}
                    >
                      Message
                    </Button>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full border-[#ffbc3b] text-[#ffbc3b] hover:bg-[#ffbc3b] hover:text-white"
                      onClick={() => handleViewNotes(student)}
                    >
                      View Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && students.length > 0 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-600">
              Showing {students.length} of {pagination.total} students
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm text-gray-600">
                Page {page} of {pagination.pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Student Detail Dialog */}
        <StudentDetailDialog
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          studentId={selectedStudentId}
        />
      </main>
    </div>
  );
}
