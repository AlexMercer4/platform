import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middlewares/authMiddleware.js";
import { requireCounselorOrChairperson } from "../middlewares/roleMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================
// GET /api/counselors/assigned - Get student's assigned counselor
// =========================================================================
router.get("/assigned", protect(), async (req, res) => {
  try {
    // Only students can access this endpoint
    if (req.user.role !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: "Access denied - students only"
      });
    }

    // Get student's assigned counselor
    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      include: {
        assignedCounselor: {
          include: {
            counselor: {
              select: {
                employeeId: true,
                department: true,
                specialization: true,
                officeLocation: true,
                officeHours: true
              }
            }
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    if (!student.assignedCounselor) {
      return res.json({
        success: true,
        message: "No assigned counselor found. Please contact admin to assign a counselor.",
        data: []
      });
    }

    // Format response
    const assignedCounselor = {
      id: student.assignedCounselor.id,
      name: student.assignedCounselor.name,
      email: student.assignedCounselor.email,
      phone: student.assignedCounselor.phone,
      employeeId: student.assignedCounselor.counselor.employeeId,
      department: student.assignedCounselor.counselor.department,
      specialization: student.assignedCounselor.counselor.specialization,
      officeLocation: student.assignedCounselor.counselor.officeLocation,
      officeHours: student.assignedCounselor.counselor.officeHours
    };

    res.json({
      success: true,
      data: [assignedCounselor] // Return as array to match frontend expectations
    });
  } catch (error) {
    console.error("Get assigned counselor error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned counselor"
    });
  }
});

// =========================================================================
// GET /api/counselors - Get counselors list
// =========================================================================
router.get("/", protect(), async (req, res) => {
  try {
    const { search, department, page = 1, limit = 10 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      user: {
        isActive: true,
        role: 'COUNSELOR'
      }
    };
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { employeeId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }

    // Get counselors with their user data
    const counselors = await prisma.counselor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            lastLogin: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } },
      skip,
      take,
    });

    // Get total count for pagination
    const total = await prisma.counselor.count({ where });

    // Format response
    const formattedCounselors = counselors.map(counselor => ({
      id: counselor.user.id,
      name: counselor.user.name,
      email: counselor.user.email,
      phone: counselor.user.phone,
      isActive: counselor.user.isActive,
      createdAt: counselor.user.createdAt,
      lastLogin: counselor.user.lastLogin,
      employeeId: counselor.employeeId,
      department: counselor.department,
      specialization: counselor.specialization,
      officeLocation: counselor.officeLocation,
      officeHours: counselor.officeHours,
      yearsOfExperience: counselor.yearsOfExperience,
      maxStudentsCapacity: counselor.maxStudentsCapacity,
      currentStudentsCount: counselor.currentStudentsCount,
      address: counselor.address
    }));

    res.json({
      success: true,
      data: formattedCounselors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get counselors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch counselors"
    });
  }
});

// =========================================================================
// GET /api/counselors/:id - Get counselor details
// =========================================================================
router.get("/:id", protect(), async (req, res) => {
  try {
    const { id } = req.params;

    // Get counselor with full details
    const counselor = await prisma.counselor.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true
          }
        }
      }
    });

    if (!counselor) {
      return res.status(404).json({
        success: false,
        message: "Counselor not found"
      });
    }

    // Get assigned students count and list
    const assignedStudents = await prisma.student.findMany({
      where: {
        assignedCounselorId: id,
        user: { isActive: true }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } }
    });

    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { counselorId: id },
      include: {
        student: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    // Calculate statistics
    const totalAppointments = await prisma.appointment.count({
      where: { counselorId: id }
    });

    const completedAppointments = await prisma.appointment.count({
      where: { 
        counselorId: id,
        status: 'COMPLETED'
      }
    });

    // Format response
    const formattedCounselor = {
      id: counselor.user.id,
      name: counselor.user.name,
      email: counselor.user.email,
      phone: counselor.user.phone,
      isActive: counselor.user.isActive,
      createdAt: counselor.user.createdAt,
      updatedAt: counselor.user.updatedAt,
      lastLogin: counselor.user.lastLogin,
      employeeId: counselor.employeeId,
      department: counselor.department,
      specialization: counselor.specialization,
      officeLocation: counselor.officeLocation,
      officeHours: counselor.officeHours,
      yearsOfExperience: counselor.yearsOfExperience,
      maxStudentsCapacity: counselor.maxStudentsCapacity,
      currentStudentsCount: assignedStudents.length,
      address: counselor.address,
      assignedStudents: assignedStudents.map(student => ({
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
        studentId: student.studentId,
        department: student.department,
        currentSemester: student.currentSemester
      })),
      recentAppointments: recentAppointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        type: apt.type.toLowerCase(),
        status: apt.status.toLowerCase(),
        student: apt.student
      })),
      statistics: {
        totalAppointments,
        completedAppointments,
        assignedStudentsCount: assignedStudents.length,
        availableCapacity: counselor.maxStudentsCapacity - assignedStudents.length
      }
    };

    res.json({
      success: true,
      data: formattedCounselor
    });
  } catch (error) {
    console.error("Get counselor details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch counselor details"
    });
  }
});

// =========================================================================
// PUT /api/counselors/:id - Update counselor profile
// =========================================================================
router.put("/:id", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      department,
      specialization,
      officeLocation,
      officeHours,
      yearsOfExperience,
      maxStudentsCapacity,
      address
    } = req.body;

    // Check permissions - counselors can update their own profile, chairperson can update any
    if (req.user.role !== 'CHAIRPERSON' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only update your own profile"
      });
    }

    // Check if counselor exists
    const existingCounselor = await prisma.counselor.findUnique({
      where: { userId: id },
      include: { user: true }
    });

    if (!existingCounselor) {
      return res.status(404).json({
        success: false,
        message: "Counselor not found"
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingCounselor.user.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }
    }

    // Validate maxStudentsCapacity
    if (maxStudentsCapacity !== undefined) {
      const currentStudentsCount = await prisma.student.count({
        where: {
          assignedCounselorId: id,
          user: { isActive: true }
        }
      });

      if (parseInt(maxStudentsCapacity) < currentStudentsCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot set capacity below current assigned students count (${currentStudentsCount})`
        });
      }
    }

    // Update user and counselor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(phone !== undefined && { phone }),
          updatedAt: new Date()
        }
      });

      // Update counselor profile
      const counselor = await tx.counselor.update({
        where: { userId: id },
        data: {
          ...(department && { department }),
          ...(specialization && { 
            specialization: Array.isArray(specialization) ? specialization : [specialization] 
          }),
          ...(officeLocation !== undefined && { officeLocation }),
          ...(officeHours !== undefined && { officeHours }),
          ...(yearsOfExperience !== undefined && { yearsOfExperience: parseInt(yearsOfExperience) }),
          ...(maxStudentsCapacity !== undefined && { maxStudentsCapacity: parseInt(maxStudentsCapacity) }),
          ...(address !== undefined && { address })
        }
      });

      return { user, counselor };
    });

    res.json({
      success: true,
      message: "Counselor profile updated successfully",
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        employeeId: result.counselor.employeeId,
        department: result.counselor.department,
        specialization: result.counselor.specialization,
        updatedAt: result.user.updatedAt
      }
    });
  } catch (error) {
    console.error("Update counselor error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update counselor profile"
    });
  }
});

export default router;