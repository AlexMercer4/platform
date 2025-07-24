import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Get analytics data
router.get("/", protect(), async (req, res) => {
  try {
    const { user } = req;
    const { startDate, endDate, timeframe } = req.query;

    // Check authorization - only chairperson and counselor can access analytics
    if (!["CHAIRPERSON", "COUNSELOR"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only chairpersons and counselors can view analytics."
      });
    }

    // Calculate date range
    let dateFilter = {};
    if (timeframe) {
      const now = new Date();
      let start;
      
      switch (timeframe) {
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start = new Date(now);
          start.setMonth(now.getMonth() - 1);
          break;
        case 'semester':
          start = new Date(now);
          start.setMonth(now.getMonth() - 4);
          break;
        default:
          start = null;
      }
      
      if (start) {
        dateFilter = { gte: start };
      }
    } else if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Role-based filtering for counselors
    const isChairperson = user.role === "CHAIRPERSON";
    const counselorFilter = isChairperson ? {} : { assignedCounselorId: user.id };
    const appointmentFilter = isChairperson ? {} : { counselorId: user.id };

    // Overview Statistics
    const [
      totalStudents,
      activeStudents,
      totalCounselors,
      activeCounselors,
      totalAppointments,
      completedAppointments
    ] = await Promise.all([
      prisma.student.count({ where: counselorFilter }),
      prisma.student.count({ 
        where: { 
          ...counselorFilter,
          user: { isActive: true } 
        } 
      }),
      isChairperson ? prisma.counselor.count() : 1,
      isChairperson ? prisma.counselor.count({ where: { user: { isActive: true } } }) : 1,
      prisma.appointment.count({ 
        where: {
          ...appointmentFilter,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),
      prisma.appointment.count({ 
        where: {
          ...appointmentFilter,
          status: "COMPLETED",
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      })
    ]);

    const completionRate = totalAppointments > 0 ? 
      Math.round((completedAppointments / totalAppointments) * 100) : 0;

    // Appointment Analytics
    const appointmentStatusData = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        ...appointmentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _count: { status: true }
    });

    const appointmentTypeData = await prisma.appointment.groupBy({
      by: ['type'],
      where: {
        ...appointmentFilter,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _count: { type: true }
    });

    // Average duration
    const avgDurationResult = await prisma.appointment.aggregate({
      where: {
        ...appointmentFilter,
        status: "COMPLETED",
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      _avg: { duration: true }
    });

    // Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyAppointments = await prisma.appointment.findMany({
      where: {
        ...appointmentFilter,
        createdAt: { gte: sixMonthsAgo }
      },
      select: { createdAt: true }
    });

    // Group by month
    const monthlyTrends = {};
    monthlyAppointments.forEach(apt => {
      const monthKey = apt.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthlyTrends[monthKey] = (monthlyTrends[monthKey] || 0) + 1;
    });

    // Student Analytics
    const departmentData = await prisma.student.groupBy({
      by: ['department'],
      where: counselorFilter,
      _count: { department: true }
    });

    const semesterData = await prisma.student.groupBy({
      by: ['currentSemester'],
      where: counselorFilter,
      _count: { currentSemester: true }
    });

    // Top engaged students
    const topEngagedStudents = await prisma.student.findMany({
      where: {
        ...counselorFilter,
        totalSessions: { gt: 0 }
      },
      include: {
        user: { select: { name: true } }
      },
      orderBy: { totalSessions: 'desc' },
      take: 5
    });

    // Counselor Analytics (only for chairperson)
    let counselorAnalytics = {};
    if (isChairperson) {
      const counselorWorkload = await prisma.appointment.groupBy({
        by: ['counselorId'],
        where: {
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        _count: { counselorId: true }
      });

      // Get counselor names
      const counselorIds = counselorWorkload.map(c => c.counselorId);
      const counselors = await prisma.user.findMany({
        where: { id: { in: counselorIds } },
        select: { id: true, name: true }
      });

      const workloadWithNames = counselorWorkload.map(workload => {
        const counselor = counselors.find(c => c.id === workload.counselorId);
        return {
          counselorName: counselor?.name || 'Unknown',
          appointmentCount: workload._count.counselorId
        };
      });

      // Specialization distribution
      const specializationData = await prisma.counselor.findMany({
        select: { specialization: true }
      });

      const specializationCount = {};
      specializationData.forEach(counselor => {
        counselor.specialization.forEach(spec => {
          specializationCount[spec] = (specializationCount[spec] || 0) + 1;
        });
      });

      counselorAnalytics = {
        workloadDistribution: workloadWithNames,
        specializationDistribution: specializationCount
      };
    }

    // Format response
    const analytics = {
      overview: {
        totalStudents,
        activeStudents,
        totalCounselors,
        activeCounselors,
        totalAppointments,
        completionRate
      },
      appointments: {
        statusDistribution: appointmentStatusData.reduce((acc, item) => {
          acc[item.status.toLowerCase()] = item._count.status;
          return acc;
        }, {}),
        typeDistribution: appointmentTypeData.reduce((acc, item) => {
          acc[item.type.toLowerCase()] = item._count.type;
          return acc;
        }, {}),
        monthlyTrends,
        averageDuration: Math.round(avgDurationResult._avg.duration || 0)
      },
      students: {
        departmentDistribution: departmentData.reduce((acc, item) => {
          acc[item.department] = item._count.department;
          return acc;
        }, {}),
        semesterDistribution: semesterData.reduce((acc, item) => {
          acc[item.currentSemester] = item._count.currentSemester;
          return acc;
        }, {}),
        topEngaged: topEngagedStudents.map(student => ({
          name: student.user.name,
          sessions: student.totalSessions,
          department: student.department
        }))
      },
      counselors: counselorAnalytics
    };

    res.json(analytics);
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: error.message
    });
  }
});

export default router;