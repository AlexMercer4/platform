import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  Users, 
  MessageCircle, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboard.service";
import { appointmentsService } from "@/services/appointments.service";
import { studentsService } from "@/services/students.service";

export default function CounselorDashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch dashboard stats
  const { 
    data: stats, 
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getDashboardStats,
    onError: (error) => {
      toast.error(`Failed to load dashboard statistics: ${error.message}`);
    }
  });

  // Fetch today's appointments
  const { 
    data: todayAppointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery({
    queryKey: ['todayAppointments'],
    queryFn: () => {
      const today = new Date().toISOString().split('T')[0];
      return appointmentsService.getAppointments({ 
        startDate: today,
        endDate: today,
        limit: 5
      });
    },
    onError: (error) => {
      toast.error(`Failed to load today's appointments: ${error.message}`);
    }
  });

  // Fetch assigned students
  const { 
    data: assignedStudents = [], 
    isLoading: isLoadingStudents,
    error: studentsError
  } = useQuery({
    queryKey: ['assignedStudents'],
    queryFn: () => studentsService.getAssignedStudents({ limit: 5 }),
    onError: (error) => {
      toast.error(`Failed to load assigned students: ${error.message}`);
    }
  });

  // Format appointment time
  const formatAppointmentTime = (date, time) => {
    try {
      return format(new Date(`${date}T${time}`), "h:mm a");
    } catch (error) {
      return time;
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Filter students based on search query
  const filteredStudents = searchQuery 
    ? (assignedStudents.data || []).filter(student => 
        student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (assignedStudents.data || []);

  if (isLoadingStats && isLoadingAppointments && isLoadingStudents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || appointmentsError || studentsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {statsError?.message || appointmentsError?.message || studentsError?.message || "Failed to load dashboard data. Please try again."}
          </p>
          <Button 
            onClick={() => window.location.reload()}
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || "Counselor"}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your counseling activities and today's appointments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Today's Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.todayAppointments || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">scheduled</div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.activeStudents || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">students</div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Unread Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.unreadMessages || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">messages</div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Session Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.sessionHours || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">this month</div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Today's Appointments Section */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>
              Your scheduled appointments for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No appointments today
                </h3>
                <p className="text-gray-500">
                  You don't have any appointments scheduled for today.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">
                          {appointment.type} Session with {appointment.student.name}
                        </h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatAppointmentTime(appointment.date, appointment.time)}</span>
                          <span className="mx-1">•</span>
                          <span>{appointment.duration} min</span>
                          <span className="mx-1">•</span>
                          <span>{appointment.location || "Online"}</span>
                        </div>
                        <div className="mt-1">
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Link to={`/appointments?id=${appointment.id}`}>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/appointments">
                <Button variant="outline">
                  View All Appointments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Students Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Assigned Students</CardTitle>
            <CardDescription>
              Students assigned to you for counseling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoadingStudents ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchQuery ? "No matching students" : "No assigned students"}
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "You don't have any students assigned to you yet."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <div key={student.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">
                          {student.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {student.studentId} • {student.department} • {student.currentSemester}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/messages?userId=${student.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to={`/students/${student.id}/notes`}>
                        <Button variant="outline" size="sm">
                          Notes
                        </Button>
                      </Link>
                      <Link to={`/students/${student.id}`}>
                        <Button size="sm">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 text-center">
              <Link to="/students">
                <Button variant="outline">
                  View All Students
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}