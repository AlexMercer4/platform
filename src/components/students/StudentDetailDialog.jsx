import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  BookOpen,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { studentsService } from "@/services/students.service";
import { toast } from "sonner";

export default function StudentDetailDialog({ 
  open, 
  onOpenChange, 
  studentId 
}) {
  const [activeTab, setActiveTab] = useState("personal");

  // Fetch student details
  const {
    data: student,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => studentsService.getStudentById(studentId),
    enabled: !!studentId && open,
    onError: (err) => {
      toast.error(`Failed to load student details: ${err.message}`);
    },
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCGPAColor = (cgpa) => {
    if (!cgpa && cgpa !== 0) return "text-gray-500";
    if (cgpa >= 3.5) return "text-green-600";
    if (cgpa >= 3.0) return "text-yellow-600";
    return "text-red-600";
  };

  // Loading state
  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading student details...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (isError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Student Details
            </h3>
            <p className="text-gray-500 text-center mb-4">
              {error?.message || "Failed to load student details"}
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No student data
  if (!student) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Student Not Found
            </h3>
            <p className="text-gray-500 text-center mb-4">
              The requested student could not be found or you don't have permission to view their details.
            </p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center">
              <User className="mr-2 h-5 w-5 text-[#0056b3]" />
              {student.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center mt-2">
            <Badge className="bg-blue-100 text-blue-800 mr-2">
              {student.studentId}
            </Badge>
            <Badge className="bg-gray-100 text-gray-800">
              {student.department}
            </Badge>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "personal"
                ? "border-b-2 border-[#0056b3] text-[#0056b3]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("personal")}
          >
            Personal Information
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "academic"
                ? "border-b-2 border-[#0056b3] text-[#0056b3]"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("academic")}
          >
            Academic Information
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-900">{student.email}</p>
                </div>
              </div>

              {student.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900">{student.phone}</p>
                  </div>
                </div>
              )}

              {student.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900">{student.address}</p>
                  </div>
                </div>
              )}

              {student.enrollmentDate && (
                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Date</p>
                    <p className="text-gray-900">
                      {formatDate(student.enrollmentDate)}
                    </p>
                  </div>
                </div>
              )}

              {/* Emergency Contact */}
              {(student.emergencyContact?.name || 
                student.emergencyContact?.phone || 
                student.emergencyContact?.relationship) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                  
                  {student.emergencyContact?.name && (
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-gray-900">{student.emergencyContact.name}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.emergencyContact?.phone && (
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="text-gray-900">{student.emergencyContact.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {student.emergencyContact?.relationship && (
                    <div className="flex items-center space-x-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Relationship</p>
                        <p className="text-gray-900">{student.emergencyContact.relationship}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "academic" && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-gray-900">{student.department}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Batch</p>
                  <p className="text-gray-900">{student.batch || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Current Semester</p>
                  <p className="text-gray-900">{student.currentSemester || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <BookOpen className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">CGPA</p>
                  <p className={`text-lg font-semibold ${getCGPAColor(student.cgpa)}`}>
                    {student.cgpa ? student.cgpa.toFixed(2) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Last Session</p>
                  <p className="text-gray-900">
                    {formatDate(student.lastSessionDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-gray-900">{student.totalSessions || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}