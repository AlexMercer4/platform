import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, User, MapPin, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { counselorsService } from "@/services/counselors.service";
import { studentsService } from "@/services/students.service";
import { useAuth } from "@/contexts/AuthContext";

export default function BookAppointmentDialog({
  open,
  onOpenChange,
  userRole,
  onSubmit,
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedCounselor, setSelectedCounselor] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth()

  // Fetch assigned counselor for students using React Query
  const {
    data: counselors = [],
    isLoading: isLoadingCounselors,
    error: counselorsError
  } = useQuery({
    queryKey: ['assigned-counselor'],
    queryFn: () => counselorsService.getAssignedCounselor(),
    enabled: open && userRole === "student",
    onError: (error) => {
      toast.error(`Failed to load assigned counselor: ${error.message}`);
    }
  });

  // Fetch students using React Query (counselors get their assigned students)
  const {
    data: students = [],
    isLoading: isLoadingStudents,
    error: studentsError
  } = useQuery({
    queryKey: ['assigned-students'],
    queryFn: () => studentsService.getAssignedStudents(),
    enabled: open && userRole === "counselor",
    onError: (error) => {
      toast.error(`Failed to load assigned students: ${error.message}`);
    }
  });

  const timeSlots = [
    { time: "09:00 AM", available: true },
    { time: "10:00 AM", available: true },
    { time: "11:00 AM", available: false },
    { time: "02:00 PM", available: true },
    { time: "03:00 PM", available: true },
    { time: "04:00 PM", available: true },
  ];

  const appointmentTypes = [
    { value: "counseling", label: "General Counseling" },
    { value: "academic", label: "Academic Guidance" },
    { value: "career", label: "Career Counseling" },
    { value: "personal", label: "Personal Issues" },
  ];

  const locations = [
    "Room 201, Counseling Center",
    "Room 105, Student Services",
    "Room 303, Academic Block",
    "Room 202, Counseling Center",
    "Online Meeting",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Prepare appointment data for API
    const appointmentData = {
      date: selectedDate,
      time: selectedTime,
      type: appointmentType.toUpperCase(), // Backend expects uppercase enum values
      location,
      notes,
    };

    // console.log(currentUserId)
    // Set the appropriate IDs based on user role
    if (userRole === "student") {
      appointmentData.studentId = user.id;
      appointmentData.counselorId = selectedCounselor;
    } else if (userRole === "counselor") {
      appointmentData.counselorId = user.id;
      appointmentData.studentId = selectedStudent;
    }

    try {
      await onSubmit(appointmentData);
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error booking appointment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate("");
    setSelectedTime("");
    setSelectedCounselor("");
    setSelectedStudent("");
    setAppointmentType("");
    setLocation("");
    setNotes("");
  };

  const isFormValid =
    selectedDate &&
    selectedTime &&
    appointmentType &&
    location &&
    (userRole === "student" ? selectedCounselor : selectedStudent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-[#0056b3]" />
            <span>Book New Appointment</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {/* Time Selection */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Time</span>
              </Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem
                      key={slot.time}
                      value={slot.time}
                      disabled={!slot.available}
                    >
                      {slot.time} {!slot.available && "(Unavailable)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Counselor/Student Selection */}
          {userRole === "student" ? (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Counselor</span>
              </Label>
              <Select
                value={selectedCounselor}
                onValueChange={setSelectedCounselor}
                disabled={isLoadingCounselors}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingCounselors
                        ? "Loading assigned counselor..."
                        : counselorsError
                          ? "Error loading assigned counselor"
                          : "Select counselor"
                    }
                  />
                </SelectTrigger>
                {/* For the counselor select */}
                <SelectContent>
                  {counselorsError ? (
                    <SelectItem value="error" disabled>
                      Failed to load assigned counselor. Please try again.
                    </SelectItem>
                  ) : !counselors || !counselors.data || counselors.data.length === 0 ? (
                    <SelectItem value="no-counselors" disabled>
                      No assigned counselor found. Please contact admin.
                    </SelectItem>
                  ) : (
                    counselors.data.map((counselor) => (
                      <SelectItem key={counselor.id} value={counselor.id}>
                        {counselor.name} - {counselor.department}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Student</span>
              </Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
                disabled={isLoadingStudents}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingStudents
                        ? "Loading students..."
                        : studentsError
                          ? "Error loading students"
                          : "Select student"
                    }
                  />
                </SelectTrigger>
                {/* For the student select */}
                <SelectContent>
                  {studentsError ? (
                    <SelectItem value="error" disabled>
                      Failed to load assigned students. Please try again.
                    </SelectItem>
                  ) : !students || !students.data || students.data.length === 0 ? (
                    <SelectItem value="no-students" disabled>
                      No assigned students found. Please contact admin to assign students.
                    </SelectItem>
                  ) : (
                    students.data.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} - {student.studentId} ({student.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Appointment Type */}
            <div className="space-y-2">
              <Label>Appointment Type</Label>
              <Select
                value={appointmentType}
                onValueChange={setAppointmentType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Notes (Optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or specific topics you'd like to discuss..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="bg-[#0056b3] hover:bg-[#004494]"
            >
              {isLoading ? "Booking..." : "Book Appointment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
