import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middlewares/authMiddleware.js";
import { requireCounselorOrChairperson, requireStudentAccess } from "../middlewares/roleMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================
// GET /api/students - Get students list (Counselors/Chairperson)
// =========================================================================
router.get("/", protect(), requireCounselorOrChairperson, async (req, res) => {
  try {
    const { search, department, batch, page = 1, limit = 10, assignedCounselor } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {
      user: {
        isActive: true,
        role: 'STUDENT'
      }
    };
    
    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { studentId: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (department) {
      where.department = { contains: department, mode: 'insensitive' };
    }
    
    if (batch) {
      where.batch = { contains: batch, mode: 'insensitive' };
    }

    // If counselor is requesting, only show their assigned students
    if (req.user.role === 'COUNSELOR') {
      where.assignedCounselorId = req.user.id;
    } else if (assignedCounselor) {
      where.assignedCounselorId = assignedCounselor;
    }

    // Get students with their user data
    const students = await prisma.student.findMany({
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
        },
        assignedCounselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { user: { createdAt: 'desc' } },
      skip,
      take,
    });

    // Get total count for pagination
    const total = await prisma.student.count({ where });

    // Format response
    const formattedStudents = students.map(student => ({
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.user.phone,
      isActive: student.user.isActive,
      createdAt: student.user.createdAt,
      lastLogin: student.user.lastLogin,
      studentId: student.studentId,
      department: student.department,
      batch: student.batch,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      enrollmentDate: student.enrollmentDate,
      address: student.address,
      assignedCounselor: student.assignedCounselor,
      emergencyContact: {
        name: student.emergencyContactName,
        phone: student.emergencyContactPhone,
        relationship: student.emergencyContactRelationship
      },
      totalSessions: student.totalSessions,
      lastSessionDate: student.lastSessionDate
    }));

    res.json({
      success: true,
      data: formattedStudents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch students"
    });
  }
});

// =========================================================================
// GET /api/students/assigned - Get counselor's assigned students
// =========================================================================
router.get("/assigned", protect(), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Only counselors can access this endpoint
    if (req.user.role !== 'COUNSELOR') {
      return res.status(403).json({
        success: false,
        message: "Access denied - counselors only"
      });
    }

    // Get assigned students
    const students = await prisma.student.findMany({
      where: {
        assignedCounselorId: req.user.id,
        user: {
          isActive: true
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            lastLogin: true
          }
        }
      },
      orderBy: { user: { name: 'asc' } },
      take: parseInt(limit),
    });

    // Format response
    const formattedStudents = students.map(student => ({
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.user.phone,
      lastLogin: student.user.lastLogin,
      studentId: student.studentId,
      department: student.department,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      totalSessions: student.totalSessions,
      lastSessionDate: student.lastSessionDate
    }));

    res.json({
      success: true,
      data: formattedStudents
    });
  } catch (error) {
    console.error("Get assigned students error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch assigned students"
    });
  }
});

// =========================================================================
// GET /api/students/:id - Get student details
// =========================================================================
router.get("/:id", protect(), requireStudentAccess, async (req, res) => {
  try {
    const { id } = req.params;

    // Get student with full details
    const student = await prisma.student.findUnique({
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
        },
        assignedCounselor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        notes: {
          include: {
            counselor: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Latest 5 notes
        }
      }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { studentId: id },
      include: {
        counselor: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 5
    });

    // Format response
    const formattedStudent = {
      id: student.user.id,
      name: student.user.name,
      email: student.user.email,
      phone: student.user.phone,
      isActive: student.user.isActive,
      createdAt: student.user.createdAt,
      updatedAt: student.user.updatedAt,
      lastLogin: student.user.lastLogin,
      studentId: student.studentId,
      department: student.department,
      batch: student.batch,
      currentSemester: student.currentSemester,
      cgpa: student.cgpa,
      enrollmentDate: student.enrollmentDate,
      address: student.address,
      assignedCounselor: student.assignedCounselor,
      emergencyContact: {
        name: student.emergencyContactName,
        phone: student.emergencyContactPhone,
        relationship: student.emergencyContactRelationship
      },
      totalSessions: student.totalSessions,
      lastSessionDate: student.lastSessionDate,
      recentNotes: student.notes.map(note => ({
        id: note.id,
        category: note.category.toLowerCase(),
        content: note.content,
        isPrivate: note.isPrivate,
        createdAt: note.createdAt,
        counselor: note.counselor
      })),
      recentAppointments: recentAppointments.map(apt => ({
        id: apt.id,
        date: apt.date,
        time: apt.time,
        type: apt.type.toLowerCase(),
        status: apt.status.toLowerCase(),
        counselor: apt.counselor
      }))
    };

    res.json({
      success: true,
      data: formattedStudent
    });
  } catch (error) {
    console.error("Get student details error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student details"
    });
  }
});

// =========================================================================
// PUT /api/students/:id - Update student profile
// =========================================================================
router.put("/:id", protect(), requireStudentAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      department,
      batch,
      currentSemester,
      address,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    } = req.body;

    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { userId: id },
      include: { user: true }
    });

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingStudent.user.email) {
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

    // Update user and student profile in a transaction
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

      // Update student profile
      const student = await tx.student.update({
        where: { userId: id },
        data: {
          ...(department && { department }),
          ...(batch && { batch }),
          ...(currentSemester && { currentSemester }),
          ...(address !== undefined && { address }),
          ...(emergencyContactName !== undefined && { emergencyContactName }),
          ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
          ...(emergencyContactRelationship !== undefined && { emergencyContactRelationship })
        }
      });

      return { user, student };
    });

    res.json({
      success: true,
      message: "Student profile updated successfully",
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        phone: result.user.phone,
        studentId: result.student.studentId,
        department: result.student.department,
        updatedAt: result.user.updatedAt
      }
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update student profile"
    });
  }
});

export default router;