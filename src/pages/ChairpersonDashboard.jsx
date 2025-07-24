import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  PieChart,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboard.service";
import { appointmentsService } from "@/services/appointments.service";

export default function ChairpersonDashboard() {
  const { user } = useAuth();
  const [statsTimeframe, setStatsTimeframe] = useState("week"); // "week", "month", "semester"

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
    data: recentAppointments = [],
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery({
    queryKey: ['recentAppointments', statsTimeframe],
    queryFn: () => appointmentsService.getAppointments({
      timeframe: statsTimeframe,
      limit: 5
    }),
    onError: (error) => {
      toast.error(`Failed to load appointments: ${error.message}`);
    }
  });

  // Calculate appointment distribution by type
  const appointmentsByType = recentAppointments.reduce((acc, appointment) => {
    acc[appointment.type] = (acc[appointment.type] || 0) + 1;
    return acc;
  }, {});

  // Calculate appointment distribution by status
  const appointmentsByStatus = recentAppointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {});

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
            Welcome back, {user?.name || "Chairperson"}
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of the counseling department's performance and statistics.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.totalStudents || 0
                  )}
                </div>
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
                <div className="ml-2 text-sm text-gray-500">
                  {stats?.totalStudents ?
                    `(${Math.round((stats.activeStudents / stats.totalStudents) * 100)}%)` :
                    ''}
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Counselors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.totalCounselors || 0
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Active Counselors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {isLoadingStats ? (
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                  ) : (
                    stats?.activeCounselors || 0
                  )}
                </div>
                <div className="ml-2 text-sm text-gray-500">
                  {stats?.totalCounselors ?
                    `(${Math.round((stats.activeCounselors / stats.totalCounselors) * 100)}%)` :
                    ''}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Department Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Department Activity</CardTitle>
              <CardDescription>
                Latest counseling activities across the department
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : recentAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {appointment.type} Session
                        </p>
                        <p className="text-sm text-gray-500">
                          {appointment.student?.name} with {appointment.counselor?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(appointment.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {appointment.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>
                Key performance indicators for this {statsTimeframe}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Student Engagement</span>
                    <span className="text-sm text-gray-500">
                      {stats?.activeStudents || 0} / {stats?.totalStudents || 0}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.totalStudents ?
                      Math.round((stats.activeStudents / stats.totalStudents) * 100) : 0}%
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Counselor Utilization</span>
                    <span className="text-sm text-gray-500">
                      {stats?.activeCounselors || 0} / {stats?.totalCounselors || 0}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.totalCounselors ?
                      Math.round((stats.activeCounselors / stats.totalCounselors) * 100) : 0}%
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Appointment Completion Rate</span>
                    <span className="text-sm text-gray-500">
                      {appointmentsByStatus.completed || 0} completed
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {recentAppointments.length ?
                      Math.round(((appointmentsByStatus.completed || 0) / recentAppointments.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Counseling Analytics</CardTitle>
                <CardDescription>
                  Overview of counseling activities and trends
                </CardDescription>
              </div>
              <div>
                <Tabs value={statsTimeframe} onValueChange={setStatsTimeframe}>
                  <TabsList>
                    <TabsTrigger value="week">Week</TabsTrigger>
                    <TabsTrigger value="month">Month</TabsTrigger>
                    <TabsTrigger value="semester">Semester</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Appointment Types */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                  Session Types Distribution
                </h3>
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : Object.keys(appointmentsByType).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No session data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(appointmentsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center">
                        <div className="w-32 text-sm font-medium">{type}</div>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.round((count / recentAppointments.length) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-500">
                          {count} ({Math.round((count / recentAppointments.length) * 100)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointment Status */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Session Status Overview
                </h3>
                {isLoadingAppointments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : Object.keys(appointmentsByStatus).length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No session data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(appointmentsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center">
                        <div className="w-32 text-sm font-medium capitalize">{status}</div>
                        <div className="flex-1 mx-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${status === 'completed' ? 'bg-green-500' :
                                status === 'scheduled' ? 'bg-blue-500' :
                                  status === 'pending' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`}
                              style={{
                                width: `${Math.round((count / recentAppointments.length) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="w-16 text-right text-sm text-gray-500">
                          {count} ({Math.round((count / recentAppointments.length) * 100)}%)
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link to="/analytics">
                <Button>
                  View Detailed Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>


      </main>
    </div>
  );
}