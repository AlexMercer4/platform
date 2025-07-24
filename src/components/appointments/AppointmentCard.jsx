import { Calendar, Clock, User, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AppointmentCard({
  appointment,
  userRole,
  currentUserId,
  onReschedule,
  onCancel,
  onComplete,
  onConfirm,
}) {
  // Normalize status once at the top
  const status = appointment.status?.toLowerCase?.() || "unknown";

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case "scheduled":
        return "border-l-blue-500";
      case "pending":
        return "border-l-yellow-500";
      case "completed":
        return "border-l-green-500";
      case "cancelled":
        return "border-l-red-500";
      default:
        return "border-l-gray-500";
    }
  };

  const canReschedule =
    (userRole === "student" || userRole === "counselor") &&
    (status === "scheduled" || status === "pending");

  const canCancel =
    (userRole === "student" || userRole === "counselor") &&
    (status === "scheduled" || status === "pending");

  // Only counselors can mark appointments as completed
  const canComplete = userRole === "counselor" && status === "scheduled";

  // For now, both parties can confirm pending appointments
  // In a complete system, you'd track who created the appointment and only allow the receiver to confirm
  // This would require adding a 'createdBy' field to the appointment model
  const canConfirm = status === "pending" && (userRole === "student" || userRole === "counselor");

  return (
    <Card
      className={`border-l-4 ${getBorderColor(status)} hover:shadow-md transition-shadow duration-200`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              {new Date(appointment.date).toLocaleDateString()}
            </span>
          </div>
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{appointment.time}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <User className="h-4 w-4" />
            <span>
              {userRole === "student"
                ? appointment.counselor?.name || "Unknown Counselor"
                : appointment.student?.name || "No student assigned"}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{appointment.location}</span>
          </div>
        </div>

        {appointment.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <strong>Notes:</strong> {appointment.notes}
            </p>
          </div>
        )}

        {(canReschedule || canCancel || canComplete || canConfirm) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {canConfirm && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onConfirm?.(appointment)}
              >
                Confirm Appointment
              </Button>
            )}
            {canReschedule && (
              <Button
                size="sm"
                className="bg-[#0056b3] hover:bg-[#004494]"
                onClick={() => onReschedule(appointment)}
              >
                Reschedule
              </Button>
            )}
            {canComplete && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onComplete?.(appointment)}
              >
                Mark as Completed
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onCancel(appointment)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
