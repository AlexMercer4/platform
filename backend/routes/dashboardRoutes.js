import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard statistics based on user role
router.get("/stats", protect(), async (req, res) => {
  try {
    const { user } = req;
    let stats = {};

    if (user.role === "STUDENT") {
      // Get upcoming appointments count
      const upcomingAppointments = await prisma.appointment.count({
        where: {
          studentId: user.id,
          status: { in: ["SCHEDULED", "PENDING"] },
          date: { gte: new Date() }
        }
      });

      // Get unread messages count
      const unreadMessages = await prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false
        }
      });

      // Get total session hours (completed appointments)
      const completedAppointments = await prisma.appointment.findMany({
        where: {
          studentId: user.id,
          status: "COMPLETED"
        },
        select: { duration: true }
      });

      const sessionHours = completedAppointments.reduce((total, apt) => total + apt.duration, 0) / 60;

      // Get assigned counselor
      const studentProfile = await prisma.student.findUnique({
        where: { userId: user.id },
        include: {
          assignedCounselor: {
            include: {
              counselor: {
                select: {
                  department: true,
                  specialization: true
                }
              }
            }
          }
        }
      });

      stats = {
        upcomingAppointments,
        unreadMessages,
        sessionHours: Math.round(sessionHours * 10) / 10,
        assignedCounselor: studentProfile?.assignedCounselor ? {
          id: studentProfile.assignedCounselor.id,
          name: studentProfile.assignedCounselor.name,
          email: studentProfile.assignedCounselor.email,
          department: studentProfile.assignedCounselor.counselor?.department,
          specialization: studentProfile.assignedCounselor.counselor?.specialization || []
        } : null
      };

    } else if (user.role === "COUNSELOR") {
      // Get today's appointments count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAppointments = await prisma.appointment.count({
        where: {
          counselorId: user.id,
          date: {
            gte: today,
            lt: tomorrow
          },
          status: { in: ["SCHEDULED", "PENDING"] }
        }
      });

      // Get active students count (assigned to this counselor)
      const activeStudents = await prisma.student.count({
        where: {
          assignedCounselorId: user.id,
          user: { isActive: true }
        }
      });

      // Get unread messages count
      const unreadMessages = await prisma.message.count({
        where: {
          receiverId: user.id,
          isRead: false
        }
      });

      // Get session hours this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthlyAppointments = await prisma.appointment.findMany({
        where: {
          counselorId: user.id,
          status: "COMPLETED",
          date: { gte: startOfMonth }
        },
        select: { duration: true }
      });

      const sessionHours = monthlyAppointments.reduce((total, apt) => total + apt.duration, 0) / 60;

      stats = {
        todayAppointments,
        activeStudents,
        unreadMessages,
        sessionHours: Math.round(sessionHours * 10) / 10
      };

    } else if (user.role === "CHAIRPERSON") {
      // Get total students count
      const totalStudents = await prisma.student.count();

      // Get active students count
      const activeStudents = await prisma.student.count({
        where: {
          user: { isActive: true }
        }
      });

      // Get total counselors count
      const totalCounselors = await prisma.counselor.count();

      // Get active counselors count
      const activeCounselors = await prisma.counselor.count({
        where: {
          user: { isActive: true }
        }
      });

      stats = {
        totalStudents,
        activeStudents,
        totalCounselors,
        activeCounselors
      };
    }

    res.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
});

// Get recent appointments for dashboard
router.get("/appointments", protect(), async (req, res) => {
  try {
    const { user } = req;
    const { limit = 5 } = req.query;

    let whereClause = {};

    // Role-based filtering
    if (user.role === "STUDENT") {
      whereClause.studentId = user.id;
    } else if (user.role === "COUNSELOR") {
      whereClause.counselorId = user.id;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        counselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: parseInt(limit)
    });

    // Format appointments to match frontend expectations
    const formattedAppointments = appointments.map(appointment => ({
      ...appointment,
      status: appointment.status.toLowerCase(),
      type: appointment.type.toLowerCase()
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Dashboard appointments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent appointments",
      error: error.message
    });
  }
});

// Get recent messages for dashboard
router.get("/messages", protect(), async (req, res) => {
  try {
    const { user } = req;
    const { limit = 5 } = req.query;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(messages);
  } catch (error) {
    console.error("Dashboard messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent messages",
      error: error.message
    });
  }
});

export default router;