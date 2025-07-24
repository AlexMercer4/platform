import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  Calendar, 
  MessageCircle, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboard.service";
import { appointmentsService } from "@/services/appointments.service";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("upcoming"); // "upcoming" or "past"

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

  // Fetch recent appointments
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery({
    queryKey: ['recentAppointments', timeframe],
    queryFn: () => appointmentsService.getAppointments({ 
      status: timeframe === "upcoming" ? ["scheduled", "pending"] : ["completed", "cancelled"],
      limit: 5
    }),
    onError: (error) => {
      toast.error(`Failed to load appointments: ${error.message}`);
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

  // Format appointment date
  const formatAppointmentDate = (date) => {
    try {
      return format(new Date(date), "MMMM d, yyyy");
    } catch (error) {
      return date;
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

  if (isLoadingStats && isLoadingAppointments) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || appointmentsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {statsError?.message || appointmentsError?.message || "Failed to load dashboard data. Please try again."}
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
            Welcome back, {user?.name || "Student"}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your counseling activities and upcoming appointments.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.upcomingAppointments || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">scheduled</div>
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
                <div className="ml-2 text-sm text-gray-500">hours</div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Appointments Section */}
        <Card className="mb-8">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                View and manage your counseling appointments
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={timeframe === "upcoming" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTimeframe("upcoming")}
              >
                Upcoming
              </Button>
              <Button 
                variant={timeframe === "past" ? "default" : "outline"} 
                size="sm"
                onClick={() => setTimeframe("past")}
              >
                Past
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No {timeframe} appointments
                </h3>
                <p className="text-gray-500 mb-4">
                  {timeframe === "upcoming" 
                    ? "You don't have any upcoming appointments scheduled."
                    : "You don't have any past appointments."}
                </p>
                {timeframe === "upcoming" && (
                  <Link to="/appointments">
                    <Button>Book an Appointment</Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-base font-medium text-gray-900">
                          {appointment.type} Session with {appointment.counselor.name}
                        </h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span>{formatAppointmentDate(appointment.date)}</span>
                          <span className="mx-1">•</span>
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatAppointmentTime(appointment.date, appointment.time)}</span>
                          <span className="mx-1">•</span>
                          <span>{appointment.duration} min</span>
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

        {/* Counselor Section */}
        {stats?.assignedCounselor && (
          <Card>
            <CardHeader>
              <CardTitle>Your Counselor</CardTitle>
              <CardDescription>
                Your assigned academic counselor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg mr-4">
                  {stats.assignedCounselor.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {stats.assignedCounselor.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {stats.assignedCounselor.department} • {stats.assignedCounselor.specialization.join(", ")}
                  </p>
                </div>
                <div className="ml-auto flex space-x-2">
                  <Link to={`/messages?userId=${stats.assignedCounselor.id}`}>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </Link>
                  <Link to="/appointments">
                    <Button size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Session
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}