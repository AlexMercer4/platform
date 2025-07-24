import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import { createNotification } from "./notificationRoutes.js";

const router = express.Router();
const prisma = new PrismaClient();

// Get appointments with role-based filtering
router.get("/", protect(), async (req, res) => {
  try {
    const { user } = req;
    const {
      status,
      type,
      startDate,
      endDate,
      timeframe,
      counselorId,
      studentId,
      page = 1,
      limit = 10
    } = req.query;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Base filter
    const filter = {};

    // Role-based filtering
    if (user.role === "STUDENT") {
      filter.studentId = user.id;
    } else if (user.role === "COUNSELOR") {
      filter.counselorId = user.id;
    }

    // Apply additional filters if provided
    if (status) {
      // Handle status as an array or single value
      if (Array.isArray(status)) {
        filter.status = { in: status.map(s => s.toUpperCase()) };
      } else {
        filter.status = status.toUpperCase();
      }
    }
    if (type) {
      // Handle type as an array or single value
      if (Array.isArray(type)) {
        filter.type = { in: type.map(t => t.toUpperCase()) };
      } else {
        filter.type = type.toUpperCase();
      }
    }

    // Handle timeframe parameter
    if (timeframe) {
      const now = new Date();
      let startDate, endDate;

      switch (timeframe) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          endDate = now;
          break;
        case 'semester':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 4); // Approximate semester length
          endDate = now;
          break;
        default:
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        filter.date = { gte: startDate, lte: endDate };
      }
    } else if (startDate && endDate) {
      filter.date = { gte: new Date(startDate), lte: new Date(endDate) };
    } else if (startDate) {
      filter.date = { gte: new Date(startDate) };
    } else if (endDate) {
      filter.date = { lte: new Date(endDate) };
    }

    // Chairperson can filter by specific counselor or student
    if (user.role === "CHAIRPERSON") {
      if (counselorId) filter.counselorId = counselorId;
      if (studentId) filter.studentId = studentId;
    }

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            student: {
              select: {
                studentId: true,
                department: true
              }
            }
          }
        },
        counselor: {
          select: {
            id: true,
            name: true,
            email: true,
            counselor: {
              select: {
                employeeId: true,
                department: true
              }
            }
          }
        }
      },
      orderBy: { date: 'asc' },
      skip,
      take
    });

    // Format appointments to match frontend expectations
    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      status: appointment.status.toLowerCase(),
      type: appointment.type.toLowerCase()
    }));

    const totalCount = await prisma.appointment.count({ where: filter });
    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error getting appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get appointments",
      error: error.message
    });
  }
});

// Create new appointment
router.post("/", protect(), async (req, res) => {
  try {
    const { user } = req;
    
    // Log the entire request body for debugging
    console.log("Appointment creation request body:", JSON.stringify(req.body));
    
    const {
      studentId,
      counselorId,
      date,
      time,
      duration = 60,
      location,
      type,
      notes
    } = req.body;

    console.log("Extracted values:", {
      studentId,
      counselorId,
      date,
      time,
      type,
      location
    });

    // Validate required fields
    if (!studentId || !counselorId || !date || !time || !type) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: studentId, counselorId, date, time, type"
      });
    }

    // Validate appointment type
    const validTypes = ["COUNSELING", "ACADEMIC", "CAREER", "PERSONAL"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid appointment type. Must be one of: ${validTypes.join(", ")}`
      });
    }

    // Check if student exists - using only id for the unique lookup
    console.log("Looking up student with ID:", studentId);
    const student = await prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Verify the found user is actually a student
    if (student.role !== "STUDENT") {
      return res.status(400).json({
        success: false,
        message: "The provided ID does not belong to a student"
      });
    }

    // Check if counselor exists - using only id for the unique lookup
    console.log("Looking up counselor with ID:", counselorId);
    const counselor = await prisma.user.findUnique({
      where: { id: counselorId }
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: "Counselor not found"
      });
    }

    // Verify the found user is actually a counselor
    if (counselor.role !== "COUNSELOR") {
      return res.status(400).json({
        success: false,
        message: "The provided ID does not belong to a counselor"
      });
    }

    // Additional validation: Check assignment relationship
    if (user.role === "STUDENT") {
      // Students can only book with their assigned counselor
      const studentProfile = await prisma.student.findUnique({
        where: { userId: user.id }
      });

      if (!studentProfile || studentProfile.assignedCounselorId !== counselorId) {
        return res.status(403).json({
          success: false,
          message: "You can only book appointments with your assigned counselor"
        });
      }
    } else if (user.role === "COUNSELOR") {
      // Counselors can only book with their assigned students
      const studentProfile = await prisma.student.findUnique({
        where: { userId: studentId }
      });

      if (!studentProfile || studentProfile.assignedCounselorId !== user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only book appointments with your assigned students"
        });
      }
    }

    // Parse date and check for conflicts
    const appointmentDate = new Date(date);
    const conflictingAppointments = await prisma.appointment.findMany({
      where: {
        OR: [
          {
            counselorId,
            date: appointmentDate,
            time,
            status: { in: ["SCHEDULED", "PENDING"] }
          },
          {
            studentId,
            date: appointmentDate,
            time,
            status: { in: ["SCHEDULED", "PENDING"] }
          }
        ]
      }
    });

    if (conflictingAppointments.length > 0) {
      return res.status(409).json({
        success: false,
        message: "There is a scheduling conflict with this appointment time"
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        studentId,
        counselorId,
        date: appointmentDate,
        time,
        duration: parseInt(duration),
        location,
        type,
        notes,
      },
      include: {
        student: { select: { id: true, name: true, email: true } },
        counselor: { select: { id: true, name: true, email: true } }
      }
    });

    console.log("Appointment created:", appointment);
    
    // Format date for notification
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create notification for student
    await createNotification(prisma, {
      userId: studentId,
      type: "APPOINTMENT_CREATED",
      title: "New Appointment",
      message: `Your appointment with ${appointment.counselor.name} has been scheduled for ${formattedDate} at ${time}`,
      relatedId: appointment.id,
      relatedType: "appointment"
    });
    
    // Create notification for counselor
    await createNotification(prisma, {
      userId: counselorId,
      type: "APPOINTMENT_CREATED",
      title: "New Appointment",
      message: `An appointment with ${appointment.student.name} has been scheduled for ${formattedDate} at ${time}`,
      relatedId: appointment.id,
      relatedType: "appointment"
    });

    // Format appointment to match frontend expectations
    const formattedAppointment = {
      ...appointment,
      status: appointment.status.toLowerCase(),
      type: appointment.type.toLowerCase()
    };

    res.status(201).json(formattedAppointment);
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create appointment",
      error: error.message
    });
  }
});

// Update appointment (reschedule)
router.put("/:id", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { date, time, duration, location, type, notes } = req.body;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check authorization
    if (user.role === "STUDENT" && existingAppointment.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this appointment"
      });
    }

    if (user.role === "COUNSELOR" && existingAppointment.counselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this appointment"
      });
    }

    // Check if appointment can be updated
    if (existingAppointment.status === "COMPLETED" || existingAppointment.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${existingAppointment.status.toLowerCase()} appointment`
      });
    }

    // Prepare update data
    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (time) updateData.time = time;
    if (duration) updateData.duration = parseInt(duration);
    if (location !== undefined) updateData.location = location;

    if (type) {
      const validTypes = ["COUNSELING", "ACADEMIC", "CAREER", "PERSONAL"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid appointment type. Must be one of: ${validTypes.join(", ")}`
        });
      }
      updateData.type = type;
    }

    if (notes !== undefined) updateData.notes = notes;

    // Check for conflicts if date or time is changed
    if (date || time) {
      const checkDate = date ? new Date(date) : existingAppointment.date;
      const checkTime = time || existingAppointment.time;

      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          id: { not: id },
          OR: [
            {
              counselorId: existingAppointment.counselorId,
              date: checkDate,
              time: checkTime,
              status: { in: ["SCHEDULED", "PENDING"] }
            },
            {
              studentId: existingAppointment.studentId,
              date: checkDate,
              time: checkTime,
              status: { in: ["SCHEDULED", "PENDING"] }
            }
          ]
        }
      });

      if (conflictingAppointments.length > 0) {
        return res.status(409).json({
          success: false,
          message: "There is a scheduling conflict with this appointment time"
        });
      }
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        student: { select: { id: true, name: true, email: true } },
        counselor: { select: { id: true, name: true, email: true } }
      }
    });
    
    // Format date for notification
    const formattedDate = updatedAppointment.date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create notification for student
    await createNotification(prisma, {
      userId: updatedAppointment.studentId,
      type: "APPOINTMENT_UPDATED",
      title: "Appointment Updated",
      message: `Your appointment with ${updatedAppointment.counselor.name} has been updated to ${formattedDate} at ${updatedAppointment.time}`,
      relatedId: updatedAppointment.id,
      relatedType: "appointment"
    });
    
    // Create notification for counselor if not the one who updated
    if (updatedAppointment.counselorId !== user.id) {
      await createNotification(prisma, {
        userId: updatedAppointment.counselorId,
        type: "APPOINTMENT_UPDATED",
        title: "Appointment Updated",
        message: `The appointment with ${updatedAppointment.student.name} has been updated to ${formattedDate} at ${updatedAppointment.time}`,
        relatedId: updatedAppointment.id,
        relatedType: "appointment"
      });
    }

    // Format appointment to match frontend expectations
    const formattedAppointment = {
      ...updatedAppointment,
      status: updatedAppointment.status.toLowerCase(),
      type: updatedAppointment.type.toLowerCase()
    };

    res.status(200).json(formattedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error.message
    });
  }
});

// Update appointment status
router.patch("/:id/status", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["SCHEDULED", "PENDING", "COMPLETED", "CANCELLED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
      });
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
      include: { 
        student: { select: { id: true, name: true } },
        counselor: { select: { id: true, name: true } }
      }
    });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check authorization - users can only update appointments they are part of
    const isStudentInAppointment = user.role === "STUDENT" && existingAppointment.studentId === user.id;
    const isCounselorInAppointment = user.role === "COUNSELOR" && existingAppointment.counselorId === user.id;
    const isChairperson = user.role === "CHAIRPERSON";

    if (!isStudentInAppointment && !isCounselorInAppointment && !isChairperson) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this appointment"
      });
    }

    // Additional validation for specific status changes
    if (status === "COMPLETED" && user.role !== "COUNSELOR") {
      return res.status(403).json({
        success: false,
        message: "Only counselors can mark appointments as completed"
      });
    }

    // Check if status is already set
    if (existingAppointment.status === status) {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${status.toLowerCase()}`
      });
    }

    // Check if appointment can be updated
    if ((existingAppointment.status === "COMPLETED" || existingAppointment.status === "CANCELLED") &&
      user.role !== "CHAIRPERSON") {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${existingAppointment.status.toLowerCase()} appointment`
      });
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: {
        student: { select: { id: true, name: true, email: true } },
        counselor: { select: { id: true, name: true, email: true } }
      }
    });

    // If status is COMPLETED, update student's session count
    if (status === "COMPLETED") {
      await prisma.student.update({
        where: { userId: existingAppointment.studentId },
        data: {
          totalSessions: { increment: 1 },
          lastSessionDate: new Date()
        }
      });
      
      // Create notification for student
      await createNotification(prisma, {
        userId: updatedAppointment.studentId,
        type: "APPOINTMENT_COMPLETED",
        title: "Appointment Completed",
        message: `Your appointment with ${updatedAppointment.counselor.name} has been marked as completed`,
        relatedId: updatedAppointment.id,
        relatedType: "appointment"
      });
    } 
    // If status is CANCELLED, notify both parties
    else if (status === "CANCELLED") {
      // Create notification for student
      await createNotification(prisma, {
        userId: updatedAppointment.studentId,
        type: "APPOINTMENT_CANCELLED",
        title: "Appointment Cancelled",
        message: `Your appointment with ${updatedAppointment.counselor.name} has been cancelled`,
        relatedId: updatedAppointment.id,
        relatedType: "appointment"
      });
      
      // Create notification for counselor if not the one who cancelled
      if (updatedAppointment.counselorId !== user.id) {
        await createNotification(prisma, {
          userId: updatedAppointment.counselorId,
          type: "APPOINTMENT_CANCELLED",
          title: "Appointment Cancelled",
          message: `The appointment with ${updatedAppointment.student.name} has been cancelled`,
          relatedId: updatedAppointment.id,
          relatedType: "appointment"
        });
      }
    }
    // If status is changed to SCHEDULED from PENDING
    else if (status === "SCHEDULED" && existingAppointment.status === "PENDING") {
      // Format date for notification
      const formattedDate = updatedAppointment.date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create notification for student
      await createNotification(prisma, {
        userId: updatedAppointment.studentId,
        type: "APPOINTMENT_UPDATED",
        title: "Appointment Confirmed",
        message: `Your appointment with ${updatedAppointment.counselor.name} on ${formattedDate} at ${updatedAppointment.time} has been confirmed`,
        relatedId: updatedAppointment.id,
        relatedType: "appointment"
      });
    }

    // Format appointment to match frontend expectations
    const formattedAppointment = {
      ...updatedAppointment,
      status: updatedAppointment.status.toLowerCase(),
      type: updatedAppointment.type.toLowerCase()
    };

    res.status(200).json(formattedAppointment);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment status",
      error: error.message
    });
  }
});

// Cancel appointment
router.delete("/:id", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({ where: { id } });

    if (!existingAppointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check authorization
    if (user.role === "STUDENT" && existingAppointment.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this appointment"
      });
    }

    if (user.role === "COUNSELOR" && existingAppointment.counselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this appointment"
      });
    }

    // Check if appointment can be deleted
    if (existingAppointment.status === "COMPLETED" && user.role !== "CHAIRPERSON") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a completed appointment"
      });
    }

    // Delete appointment
    await prisma.appointment.delete({ where: { id } });
    res.status(200).json({ id });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete appointment",
      error: error.message
    });
  }
});

export default router;