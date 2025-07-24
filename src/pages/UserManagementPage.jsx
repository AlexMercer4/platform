import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, GraduationCap, UserCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import AddStudentDialog from "@/components/users/AddStudentDialog";
import AddCounselorDialog from "@/components/users/AddCounselorDialog";
import EditUserDialog from "@/components/users/EditUserDialog";
import ViewUserDetailsDialog from "@/components/users/ViewUserDetailsDialog";
import UserManagementTable from "@/components/users/UserManagementTable";
import { usersService } from "@/services/users.service";
import { studentsService } from "@/services/students.service";
import { counselorsService } from "@/services/counselors.service";

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [isAddCounselorDialogOpen, setIsAddCounselorDialogOpen] =
    useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToView, setUserToView] = useState(null);

  const queryClient = useQueryClient();

  // Fetch students using React Query
  const {
    data: students = [],
    isLoading: isLoadingStudents,
    error: studentsError
  } = useQuery({
    queryKey: ['users', 'students'],
    queryFn: () => usersService.getUsers({ role: 'student' }),
    onError: (error) => {
      toast.error(`Failed to load students: ${error.message}`);
    }
  });

  // Fetch counselors using React Query
  const {
    data: counselors = [],
    isLoading: isLoadingCounselors,
    error: counselorsError
  } = useQuery({
    queryKey: ['users', 'counselors'],
    queryFn: () => usersService.getUsers({ role: 'counselor' }),
    onError: (error) => {
      toast.error(`Failed to load counselors: ${error.message}`);
    }
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData) => usersService.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'students'] });
      toast.success("Student added successfully!");
      setIsAddStudentDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add student: ${error.message}`);
    }
  });

  // Create counselor mutation
  const createCounselorMutation = useMutation({
    mutationFn: (counselorData) => usersService.createCounselor(counselorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'counselors'] });
      toast.success("Counselor added successfully!");
      setIsAddCounselorDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to add counselor: ${error.message}`);
    }
  });

  const handleAddStudent = async (studentData) => {
    try {
      createStudentMutation.mutate({
        ...studentData,
        role: "student",
        cgpa: 0,
        enrollmentDate: new Date().toISOString().split("T")[0],
        isActive: true
      });
    } catch (error) {
      console.error("Error adding student:", error);
    }
  };

  const handleAddCounselor = async (counselorData) => {
    try {
      createCounselorMutation.mutate({
        ...counselorData,
        role: "counselor",
        currentStudentsCount: 0,
        isActive: true
      });
    } catch (error) {
      console.error("Error adding counselor:", error);
    }
  };

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }) => usersService.updateUser(userId, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`${data.role === "student" ? "Student" : "Counselor"} updated successfully!`);
      setIsEditDialogOpen(false);
      setUserToEdit(null);
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    }
  });

  const handleEditUser = (user) => {
    setUserToEdit(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (userData) => {
    if (!userToEdit) return;

    try {
      updateUserMutation.mutate({
        userId: userToEdit.id,
        userData: {
          ...userData,
          role: userToEdit.role
        }
      });
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => usersService.deleteUser(userId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const userType = userToDelete?.role === "student" ? "Student" : "Counselor";
      toast.success(`${userType} deleted successfully`);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    }
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: (userId) => usersService.toggleUserStatus(userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      const userType = data.role === "student" ? "Student" : "Counselor";
      const statusText = data.isActive ? "activated" : "blocked";
      toast.success(`${userType} ${statusText} successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to update user status: ${error.message}`);
    }
  });

  // Assign counselor mutation
  const assignCounselorMutation = useMutation({
    mutationFn: ({ studentId, counselorId }) =>
      usersService.assignCounselorToStudent(studentId, counselorId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(data.message || "Counselor assignment updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to assign counselor: ${error.message}`);
    }
  });

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;

    try {
      deleteUserMutation.mutate(userToDelete.id);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleUserStatus = (user) => {
    try {
      toggleUserStatusMutation.mutate(user.id);
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const handleViewUserDetails = (user) => {
    setUserToView(user);
    setIsViewDetailsDialogOpen(true);
  };

  const handleAssignCounselor = async (studentId, counselorId) => {
    try {
      assignCounselorMutation.mutate({ studentId, counselorId });
    } catch (error) {
      console.error("Error assigning counselor:", error);
    }
  };

  const getStats = () => {
    const activeStudents = students.filter((s) => s.isActive).length;
    const inactiveStudents = students.filter((s) => !s.isActive).length;
    const activeCounselors = counselors.filter((c) => c.isActive).length;
    const inactiveCounselors = counselors.filter((c) => !c.isActive).length;

    return {
      totalStudents: students.length,
      activeStudents,
      inactiveStudents,
      totalCounselors: counselors.length,
      activeCounselors,
      inactiveCounselors,
    };
  };

  const stats = getStats();

  // Handle loading state
  if (isLoadingStudents || isLoadingCounselors) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading user management data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (studentsError || counselorsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-4">
            {studentsError?.message || counselorsError?.message || "Failed to load user data. Please try again."}
          </p>
          <Button
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['users'] });
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage students and counselors in the system.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Students
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeStudents} active, {stats.inactiveStudents} inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Counselors
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCounselors}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCounselors} active, {stats.inactiveCounselors}{" "}
                inactive
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Counselors
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.activeCounselors}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="students">
                Students ({students.length})
              </TabsTrigger>
              <TabsTrigger value="counselors">
                Counselors ({counselors.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex space-x-2">
              {activeTab === "students" && (
                <Button
                  onClick={() => setIsAddStudentDialogOpen(true)}
                  className="bg-[#0056b3] hover:bg-[#004494] flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Student</span>
                </Button>
              )}

              {activeTab === "counselors" && (
                <Button
                  onClick={() => setIsAddCounselorDialogOpen(true)}
                  className="bg-[#0056b3] hover:bg-[#004494] flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Add Counselor</span>
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="students" className="space-y-6">
            <UserManagementTable
              users={students}
              userType="student"
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
              onViewDetails={handleViewUserDetails}
            />
          </TabsContent>

          <TabsContent value="counselors" className="space-y-6">
            <UserManagementTable
              users={counselors}
              userType="counselor"
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onToggleStatus={handleToggleUserStatus}
              onViewDetails={handleViewUserDetails}
            />
          </TabsContent>
        </Tabs>

        {/* Add Student Dialog */}
        <AddStudentDialog
          open={isAddStudentDialogOpen}
          onOpenChange={setIsAddStudentDialogOpen}
          onSubmit={handleAddStudent}
        />

        {/* Add Counselor Dialog */}
        <AddCounselorDialog
          open={isAddCounselorDialogOpen}
          onOpenChange={setIsAddCounselorDialogOpen}
          onSubmit={handleAddCounselor}
        />

        {/* Edit User Dialog */}
        <EditUserDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          user={userToEdit}
          onSubmit={handleUpdateUser}
        />

        {/* View User Details Dialog */}
        <ViewUserDetailsDialog
          open={isViewDetailsDialogOpen}
          onOpenChange={setIsViewDetailsDialogOpen}
          user={userToView}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete{" "}
                {userToDelete?.role === "student" ? "Student" : "Counselor"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.name}? This
                action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteUser}
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
