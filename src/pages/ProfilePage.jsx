import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  BookOpen,
  GraduationCap,
  Edit,
  Key,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EditProfileDialog from "@/components/profile/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/auth.service";
import { studentsService } from "@/services/students.service";
import { counselorsService } from "@/services/counselors.service";
import { usersService } from "@/services/users.service";

export default function ProfilePage() {
  const { id } = useParams();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { user } = useAuth();
  const userRole = user?.role;

  const queryClient = useQueryClient();
  const isViewingOtherProfile = id && userRole === "counselor";

  // Fetch current user profile or specific student profile
  const {
    data: userProfile,
    isLoading: isLoadingProfile,
    error: profileError
  } = useQuery({
    queryKey: ['profile', id || user?.id],
    queryFn: async () => {
      try {
        // If viewing another student's profile as a counselor
        if (isViewingOtherProfile) {
          const response = await studentsService.getStudentById(id);
          console.log("Student profile (other):", response);
          const profileData = response.data || response;
          return { ...profileData, role: "student" };
        }

        // Otherwise fetch current user's profile based on role
        if (userRole === "student") {
          const userData = await authService.getCurrentUser();
          console.log("Current user data (student):", userData);
          const actualUser = userData.user || userData;
          const response = await studentsService.getStudentById(actualUser.id);
          console.log("Student profile:", response);
          const profileData = response.data || response;
          return { ...profileData, role: "student" };
        } else if (userRole === "counselor") {
          const userData = await authService.getCurrentUser();
          console.log("Current user data (counselor):", userData);
          const actualUser = userData.user || userData;
          const response = await counselorsService.getCounselorById(actualUser.id);
          console.log("Counselor profile:", response);
          const profileData = response.data || response;

          // Ensure counselor professional information is available
          return {
            ...profileData,
            role: "counselor",
            specialization: profileData.specialization || ["General Counseling"],
            officeLocation: profileData.officeLocation || "Main Campus",
            officeHours: profileData.officeHours || "9:00 AM - 5:00 PM",
            yearsOfExperience: profileData.yearsOfExperience || 0,
            currentStudentsCount: profileData.currentStudentsCount || 0,
            maxStudentsCapacity: profileData.maxStudentsCapacity || 40
          };
        } else {
          // For chairperson or other roles, just use the basic user data
          const userData = await authService.getCurrentUser();
          console.log("Current user data (chairperson):", userData);
          const profileData = userData.user || userData;

          // Add default professional information for chairperson
          return {
            ...profileData,
            role: "chairperson",
            department: profileData.department || "Administration",
            position: "System Administrator",
            responsibilities: ["User Management", "System Administration", "Oversight"]
          };
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Profile fetch error:", error);
      toast.error(`Failed to load profile: ${error.message}`);
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updatedFields) => {
      if (userRole === "student") {
        return studentsService.updateStudent(userProfile.id, updatedFields);
      } else if (userRole === "counselor") {
        return counselorsService.updateCounselor(userProfile.id, updatedFields);
      } else {
        return usersService.updateUser(userProfile.id, updatedFields);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userProfile.id] });
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    }
  });

  const handleSaveProfile = async (updatedFields) => {
    try {
      updateProfileMutation.mutate(updatedFields);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleResetPassword = () => {
    // This would typically open a password reset dialog or redirect to a password reset page
    toast.info("Password reset functionality would be implemented here");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "student":
        return "bg-blue-100 text-blue-800";
      case "counselor":
        return "bg-green-100 text-green-800";
      case "chairperson":
        return "bg-purple-100 text-purple-800";
      case "super_admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handle loading state
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile data...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">
            {profileError.message || "Failed to load profile data. Please try again."}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['profile', id || user?.id] })}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // If no profile data is available
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            The requested profile could not be found or you don't have permission to view it.
          </p>
          <Button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isViewingOtherProfile
              ? `${userProfile.name}'s Profile`
              : "Profile"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isViewingOtherProfile
              ? "View student information and academic details."
              : "Manage your account information and settings."}
          </p>
        </div>

        {/* Profile Header Card */}
        <Card className="mb-8 bg-gradient-to-r from-[#0056b3] to-[#004494] text-white">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-[#ffbc3b] p-4 rounded-full">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getRoleColor(userProfile.role)}>
                      {userProfile.role ?
                        userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1) :
                        'Unknown'
                      }
                    </Badge>
                    {userProfile.studentId && (
                      <span className="text-blue-100">
                        ID: {userProfile.studentId}
                      </span>
                    )}
                    {userProfile.employeeId && (
                      <span className="text-blue-100">
                        ID: {userProfile.employeeId}
                      </span>
                    )}
                    {userProfile.department && (
                      <span className="text-blue-100">
                        • {userProfile.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isViewingOtherProfile && (
                <div className="mt-4 md:mt-0 flex space-x-2">
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    className="bg-[#ffbc3b] hover:bg-[#e6a834] text-white flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <User className="h-5 w-5 text-[#0056b3]" />
                <span>Personal Information</span>
              </h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{userProfile.email}</p>
                  </div>
                </div>

                {userProfile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">{userProfile.phone}</p>
                    </div>
                  </div>
                )}

                {userProfile.address && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-gray-900">{userProfile.address}</p>
                    </div>
                  </div>
                )}

                {userProfile.enrollmentDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Enrollment Date</p>
                      <p className="text-gray-900">
                        {userProfile.enrollmentDate}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Academic/Professional Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                {userProfile.role === "student" ? (
                  <BookOpen className="h-5 w-5 text-[#0056b3]" />
                ) : (
                  <GraduationCap className="h-5 w-5 text-[#0056b3]" />
                )}
                <span>
                  {userProfile.role === "student"
                    ? "Academic Information"
                    : "Professional Information"}
                </span>
              </h3>

              <div className="space-y-4">
                {userProfile.role === "student" && (
                  <>
                    {userProfile.currentSemester && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Current Semester
                        </p>
                        <p className="text-gray-900">
                          {userProfile.currentSemester}
                        </p>
                      </div>
                    )}

                    {userProfile.cgpa !== undefined && userProfile.cgpa !== null && (
                      <div>
                        <p className="text-sm text-gray-500">CGPA</p>
                        <p className="text-gray-900 font-semibold text-lg text-[#ffbc3b]">
                          {typeof userProfile.cgpa === 'number' ? userProfile.cgpa.toFixed(2) : userProfile.cgpa}
                        </p>
                      </div>
                    )}

                    {userProfile.academicAdvisor && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Academic Advisor
                        </p>
                        <p className="text-gray-900">
                          {userProfile.academicAdvisor}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {userProfile.role === "counselor" && (
                  <>
                    {userProfile.specialization && Array.isArray(userProfile.specialization) && (
                      <div>
                        <p className="text-sm text-gray-500">Specialization</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {userProfile.specialization.map((spec, index) => (
                            <Badge key={index} variant="secondary">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {userProfile.officeLocation && (
                      <div>
                        <p className="text-sm text-gray-500">Office Location</p>
                        <p className="text-gray-900">
                          {userProfile.officeLocation}
                        </p>
                      </div>
                    )}

                    {userProfile.officeHours && (
                      <div>
                        <p className="text-sm text-gray-500">Office Hours</p>
                        <p className="text-gray-900">
                          {userProfile.officeHours}
                        </p>
                      </div>
                    )}

                    {userProfile.yearsOfExperience && (
                      <div>
                        <p className="text-sm text-gray-500">Years of Experience</p>
                        <p className="text-gray-900">
                          {userProfile.yearsOfExperience} years
                        </p>
                      </div>
                    )}

                    {userProfile.currentStudentsCount !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500">Student Capacity</p>
                        <p className="text-gray-900">
                          {userProfile.currentStudentsCount} / {userProfile.maxStudentsCapacity || 'N/A'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {userProfile.role === "chairperson" && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Position</p>
                      <p className="text-gray-900">
                        {userProfile.position || "System Administrator"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="text-gray-900">
                        {userProfile.department || "Administration"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Responsibilities</p>
                      <p className="text-gray-900">
                        {userProfile.responsibilities ?
                          (Array.isArray(userProfile.responsibilities) ?
                            userProfile.responsibilities.join(", ") :
                            userProfile.responsibilities) :
                          "User Management, System Administration, Oversight"}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          {(userProfile.emergencyContactName || userProfile.emergencyContactPhone || userProfile.emergencyContactRelationship) && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-[#0056b3]" />
                  <span>Emergency Contact</span>
                </h3>

                <div className="space-y-4">
                  {userProfile.emergencyContactName && (
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-gray-900">
                        {userProfile.emergencyContactName}
                      </p>
                    </div>
                  )}

                  {userProfile.emergencyContactPhone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-gray-900">
                        {userProfile.emergencyContactPhone}
                      </p>
                    </div>
                  )}

                  {userProfile.emergencyContactRelationship && (
                    <div>
                      <p className="text-sm text-gray-500">Relationship</p>
                      <p className="text-gray-900">
                        {userProfile.emergencyContactRelationship}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Security - Only show for own profile */}
          {!isViewingOtherProfile && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Key className="h-5 w-5 text-[#0056b3]" />
                  <span>Account Security</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="text-gray-900">
                      {userProfile.lastLogin
                        ? formatDate(userProfile.lastLogin)
                        : "Never"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="text-gray-900">
                      {formatDate(userProfile.createdAt)}
                    </p>
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    variant="outline"
                    className="w-full border-[#0056b3] text-[#0056b3] hover:bg-[#0056b3] hover:text-white"
                  >
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Profile Dialog - Only show for own profile */}
        {!isViewingOtherProfile && (
          <EditProfileDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            userProfile={userProfile}
            onSave={handleSaveProfile}
          />
        )}
      </main>
    </div>
  );
}
