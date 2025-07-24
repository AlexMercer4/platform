import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, BarChart3, PieChart, Users, UserCheck, Clock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("all");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch analytics data with React Query
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["analytics", timeframe, startDate, endDate],
    queryFn: () => analyticsService.getAnalytics({ 
      timeframe: timeframe !== "all" ? timeframe : undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined
    }),
    onError: (error) => {
      toast.error(`Failed to load analytics: ${error.message}`);
    }
  });

  // Handle timeframe selection
  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    // Reset custom date range when selecting a predefined timeframe
    if (value !== "custom") {
      setStartDate(null);
      setEndDate(null);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">
            {error?.message || "Failed to load analytics data. Please try again."}
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

  // Extract data for easier access
  const { overview, appointments, students, counselors } = data || {
    overview: {},
    appointments: { statusDistribution: {}, typeDistribution: {}, monthlyTrends: {} },
    students: { departmentDistribution: {}, semesterDistribution: {}, topEngaged: [] },
    counselors: { workloadDistribution: [], specializationDistribution: {} }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into counseling activities and student engagement.
          </p>
        </div>
        
        {/* Filters Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Timeframe selector */}
            <Select value={timeframe} onValueChange={handleTimeframeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
                <SelectItem value="semester">Current Semester</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom date range */}
            {timeframe === "custom" && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "MMM dd, yyyy") : "Start Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM dd, yyyy") : "End Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) => startDate && date < startDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {overview.totalStudents || 0}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {overview.activeStudents || 0} active
              </p>
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
                  {overview.totalCounselors || 0}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {overview.activeCounselors || 0} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {overview.totalAppointments || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {overview.completionRate || 0}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Avg. Session Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold text-gray-900">
                  {appointments.averageDuration || 0}
                </div>
                <div className="ml-1 text-sm text-gray-500">min</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            {user?.role === "CHAIRPERSON" && (
              <TabsTrigger value="counselors">Counselors</TabsTrigger>
            )}
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Appointment Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Appointment Status
                  </CardTitle>
                  <CardDescription>Distribution of appointment statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(appointments.statusDistribution).length === 0 ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-gray-500">No appointment data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(appointments.statusDistribution).map(([status, count]) => (
                        <div key={status} className="flex items-center">
                          <div className="w-24 text-sm font-medium capitalize">{status}</div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  status === 'completed' ? 'bg-green-500' :
                                  status === 'scheduled' ? 'bg-blue-500' :
                                  status === 'pending' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, (count / Math.max(...Object.values(appointments.statusDistribution))) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-gray-500">{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Appointment Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Appointment Types
                  </CardTitle>
                  <CardDescription>Distribution of appointment types</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(appointments.typeDistribution).length === 0 ? (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-gray-500">No appointment data available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(appointments.typeDistribution).map(([type, count]) => (
                        <div key={type} className="flex items-center">
                          <div className="w-24 text-sm font-medium capitalize">{type}</div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(100, (count / Math.max(...Object.values(appointments.typeDistribution))) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-gray-500">{count}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Appointment Trends</CardTitle>
                <CardDescription>Number of appointments over the last 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.monthlyTrends && Object.keys(appointments.monthlyTrends).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(appointments.monthlyTrends)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([month, count]) => (
                        <div key={month} className="flex items-center">
                          <div className="w-24 text-sm font-medium">{formatMonthYear(month)}</div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-blue-600 rounded-full h-4" 
                                style={{ 
                                  width: `${Math.min(100, (count / Math.max(...Object.values(appointments.monthlyTrends))) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-gray-500">{count}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-gray-500">No appointment trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Department Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>Students by department</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.departmentDistribution && Object.keys(students.departmentDistribution).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(students.departmentDistribution).map(([dept, count]) => (
                        <div key={dept} className="flex items-center">
                          <div className="w-32 text-sm font-medium truncate" title={dept}>{dept}</div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 rounded-full h-2" 
                                style={{ 
                                  width: `${Math.min(100, (count / Math.max(...Object.values(students.departmentDistribution))) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-gray-500">{count}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-gray-500">No department data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Engaged Students */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Engaged Students</CardTitle>
                  <CardDescription>Students with most counseling sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.topEngaged && students.topEngaged.length > 0 ? (
                    <div className="space-y-4">
                      {students.topEngaged.map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mr-3">
                              {student.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.department}</p>
                            </div>
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm font-medium">
                            {student.sessions} sessions
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[200px]">
                      <p className="text-gray-500">No student engagement data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Counselors Tab (only for chairperson) */}
          {user?.role === "CHAIRPERSON" && (
            <TabsContent value="counselors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Counselor Workload</CardTitle>
                  <CardDescription>Appointments handled by each counselor</CardDescription>
                </CardHeader>
                <CardContent>
                  {counselors.workloadDistribution && counselors.workloadDistribution.length > 0 ? (
                    <div className="space-y-4">
                      {counselors.workloadDistribution.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-32 text-sm font-medium truncate" title={item.counselorName}>
                            {item.counselorName}
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 rounded-full h-2" 
                                style={{ 
                                  width: `${Math.min(100, (item.appointmentCount / Math.max(...counselors.workloadDistribution.map(c => c.appointmentCount))) * 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                          <div className="w-12 text-right text-sm text-gray-500">{item.appointmentCount}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-gray-500">No counselor workload data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}

// Helper function to format month-year string
function formatMonthYear(monthYearStr) {
  const [year, month] = monthYearStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return format(date, 'MMM yyyy');
}