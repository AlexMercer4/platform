import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import BookAppointmentDialog from "@/components/appointments/BookAppointmentDialog";
import RescheduleAppointmentDialog from "@/components/appointments/RescheduleAppointmentDialog";
import AppointmentFilters from "@/components/appointments/AppointmentFilters";
import { useAuth } from "@/contexts/AuthContext";
import { appointmentsService } from "@/services/appointments.service";

export default function AppointmentsPage() {
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [filters, setFilters] = useState({});
  const { user } = useAuth();
  const userRole = user?.role;

  const queryClient = useQueryClient();
  
  // Fetch appointments using React Query
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => appointmentsService.getAppointments(filters),
    onError: (error) => {
      toast.error(`Failed to load appointments: ${error.message}`);
    }
  });

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: (appointmentData) => appointmentsService.createAppointment(appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Appointment booked successfully!");
      setIsBookingDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to book appointment: ${error.message}`);
    }
  });

  // Update appointment status mutation (for completing, cancelling, and confirming appointments)
  const updateAppointmentStatusMutation = useMutation({
    mutationFn: ({ appointmentId, status }) => 
      appointmentsService.updateAppointmentStatus(appointmentId, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      let statusMessage = "Appointment status updated successfully";
      
      switch (variables.status) {
        case "CANCELLED":
          statusMessage = "Appointment cancelled successfully";
          break;
        case "COMPLETED":
          statusMessage = "Appointment marked as completed";
          break;
        case "SCHEDULED":
          statusMessage = "Appointment confirmed successfully";
          break;
        default:
          statusMessage = "Appointment status updated successfully";
      }
      
      toast.success(statusMessage);
    },
    onError: (error) => {
      toast.error(`Failed to update appointment status: ${error.message}`);
    }
  });

  // Update appointment mutation (for rescheduling)
  const updateAppointmentMutation = useMutation({
    mutationFn: ({ appointmentId, appointmentData }) => 
      appointmentsService.updateAppointment(appointmentId, appointmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success("Appointment rescheduled successfully!");
    },
    onError: (error) => {
      toast.error(`Failed to reschedule appointment: ${error.message}`);
    }
  });

  const handleBookAppointment = async (appointmentData) => {
    try {
      createAppointmentMutation.mutate(appointmentData);
    } catch (error) {
      console.error("Error booking appointment:", error);
    }
  };

  const handleReschedule = (appointment) => {
    setAppointmentToReschedule(appointment);
    setIsRescheduleDialogOpen(true);
  };
  
  const handleRescheduleSubmit = (updatedAppointment) => {
    try {
      updateAppointmentMutation.mutate({
        appointmentId: updatedAppointment.id,
        appointmentData: updatedAppointment
      });
      setIsRescheduleDialogOpen(false);
      setAppointmentToReschedule(null);
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
    }
  };

  const handleCancel = (appointment) => {
    try {
      updateAppointmentStatusMutation.mutate({ 
        appointmentId: appointment.id, 
        status: "CANCELLED" 
      });
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };

  const handleComplete = (appointment) => {
    try {
      updateAppointmentStatusMutation.mutate({ 
        appointmentId: appointment.id, 
        status: "COMPLETED" 
      });
    } catch (error) {
      console.error("Error completing appointment:", error);
    }
  };

  const handleConfirm = (appointment) => {
    try {
      updateAppointmentStatusMutation.mutate({ 
        appointmentId: appointment.id, 
        status: "SCHEDULED" 
      });
    } catch (error) {
      console.error("Error confirming appointment:", error);
    }
  };

  const canBookAppointment = userRole === "student" || userRole === "counselor";

  // Handle loading state
  if (isLoadingAppointments) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (appointmentsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Appointments</h2>
          <p className="text-gray-600 mb-4">
            {appointmentsError.message || "Failed to load appointments. Please try again."}
          </p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600 mt-2">
              Manage your counseling sessions and schedule.
            </p>
          </div>

          {canBookAppointment && (
            <Button
              onClick={() => setIsBookingDialogOpen(true)}
              className="mt-4 sm:mt-0 bg-[#0056b3] hover:bg-[#004494] flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Book Appointment</span>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6">
          <AppointmentFilters
            filters={filters}
            onFiltersChange={setFilters}
            userRole={userRole}
          />
        </div>

        {/* Appointments List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Appointments ({appointments.length})
            </h2>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No appointments found.</p>
              {canBookAppointment && (
                <Button
                  onClick={() => setIsBookingDialogOpen(true)}
                  className="mt-4 bg-[#0056b3] hover:bg-[#004494]"
                >
                  Book Your First Appointment
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {appointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  userRole={userRole}
                  currentUserId={user?.id}
                  onReschedule={handleReschedule}
                  onCancel={handleCancel}
                  onComplete={handleComplete}
                  onConfirm={handleConfirm}
                />
              ))}
            </div>
          )}
        </div>

        {/* Book Appointment Dialog */}
        <BookAppointmentDialog
          open={isBookingDialogOpen}
          onOpenChange={setIsBookingDialogOpen}
          userRole={userRole}
          onSubmit={handleBookAppointment}
        />

        {/* Reschedule Appointment Dialog */}
        <RescheduleAppointmentDialog
          open={isRescheduleDialogOpen}
          onOpenChange={setIsRescheduleDialogOpen}
          appointment={appointmentToReschedule}
          onSubmit={handleRescheduleSubmit}
        />
      </main>
    </div>
  );
}