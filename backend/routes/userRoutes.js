import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { protect } from "../middlewares/authMiddleware.js";
import { requireChairperson, requireCounselorOrChairperson } from "../middlewares/roleMiddleware.js";
import { authValidation } from "../middlewares/validationMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================
// GET /api/users - Get all users with role-based filtering (Chairperson only)
// =========================================================================
router.get("/", protect(), requireChairperson, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10, isActive } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where = {};
    
    if (role && ['STUDENT', 'COUNSELOR', 'CHAIRPERSON'].includes(role.toUpperCase())) {
      where.role = role.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Get users with their profile data
    const users = await prisma.user.findMany({
      where,
      include: {
        counselor: true,
        student: {
          include:{
            assignedCounselor: true
            }
          }
        },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    // console.log(users)

    // Get total count for pagination
    const total = await prisma.user.count({ where });

    // Format response
    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.toLowerCase(),
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      // Include profile-specific data
      ...(user.role === 'STUDENT' && user.student && {
        studentId: user.student.studentId,
        department: user.student.department,
        batch: user.student.batch,
        currentSemester: user.student.currentSemester,
        cgpa: user.student.cgpa,
        assignedCounselorId: user.student.assignedCounselorId,
        assignedCounselor: user.student.assignedCounselor ? {
          id: user.student.assignedCounselorId,
          name: user.student.assignedCounselor.name,
          email: user.student.assignedCounselor.email,
          department: user.student.assignedCounselor.department,
          specialization: user.student.assignedCounselor.specialization
        } : null,
        address: user.student.address,
        emergencyContact: {
          name: user.student.emergencyContactName,
          phone: user.student.emergencyContactPhone,
          relationship: user.student.emergencyContactRelationship
        }
      }),
      ...(user.role === 'COUNSELOR' && user.counselor && {
        employeeId: user.counselor.employeeId,
        department: user.counselor.department,
        specialization: user.counselor.specialization,
        officeLocation: user.counselor.officeLocation,
        maxStudentsCapacity: user.counselor.maxStudentsCapacity,
        currentStudentsCount: user.counselor.currentStudentsCount,
      }),
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

// =========================================================================
// POST /api/users/students - Create new student (Chairperson only)
// =========================================================================
router.post("/students", protect(), requireChairperson, authValidation.register, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      studentId,
      department,
      batch,
      currentSemester,
      enrollmentDate,
      address,
      assignedCounselorId,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Check if studentId already exists
    if (studentId) {
      const existingStudent = await prisma.student.findUnique({
        where: { studentId }
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: "Student ID already exists"
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: 'STUDENT',
          isActive: true
        }
      });

      // Create student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          studentId: studentId || `STU-${Date.now()}`,
          department: department || 'General',
          batch: batch || 'Current',
          currentSemester: currentSemester || '1st Semester',
          enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
          address,
          assignedCounselorId,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship
        }
      });

      return { user, student };
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role.toLowerCase(),
        studentId: result.student.studentId,
        department: result.student.department
      }
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create student"
    });
  }
});

// =========================================================================
// POST /api/users/counselors - Create new counselor (Chairperson only)
// =========================================================================
router.post("/counselors", protect(), requireChairperson, authValidation.register, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      employeeId,
      department,
      specialization,
      officeLocation,
      officeHours,
      yearsOfExperience,
      maxStudentsCapacity,
      address
    } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Check if employeeId already exists
    if (employeeId) {
      const existingCounselor = await prisma.counselor.findUnique({
        where: { employeeId }
      });

      if (existingCounselor) {
        return res.status(400).json({
          success: false,
          message: "Employee ID already exists"
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and counselor profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: 'COUNSELOR',
          isActive: true
        }
      });

      // Create counselor profile
      const counselor = await tx.counselor.create({
        data: {
          userId: user.id,
          employeeId: employeeId || `EMP-${Date.now()}`,
          department: department || 'Counseling',
          specialization: Array.isArray(specialization) ? specialization : ['General Counseling'],
          officeLocation,
          officeHours,
          yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : 0,
          maxStudentsCapacity: maxStudentsCapacity ? parseInt(maxStudentsCapacity) : 40,
          currentStudentsCount: 0,
          address
        }
      });

      return { user, counselor };
    });

    res.status(201).json({
      success: true,
      message: "Counselor created successfully",
      data: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role.toLowerCase(),
        employeeId: result.counselor.employeeId,
        department: result.counselor.department
      }
    });
  } catch (error) {
    console.error("Create counselor error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create counselor"
    });
  }
});

// =========================================================================
// PUT /api/users/:id - Update user profile
// =========================================================================
router.put("/:id", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, ...profileData } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check permissions - users can update their own profile, chairperson can update any
    if (req.user.role !== 'CHAIRPERSON' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only update your own profile"
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingUser.email) {
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

    // Check if studentId is being changed and if it already exists (for students)
    if (existingUser.role === 'STUDENT' && profileData.studentId && existingUser.student) {
      if (profileData.studentId !== existingUser.student.studentId) {
        const studentIdExists = await prisma.student.findUnique({
          where: { studentId: profileData.studentId }
        });

        if (studentIdExists) {
          return res.status(400).json({
            success: false,
            message: "Student ID already exists"
          });
        }
      }
    }

    // Update user and profile in a transaction
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

      // Update profile based on role
      if (existingUser.role === 'STUDENT' && existingUser.student) {
        const studentData = {};
        if (profileData.department) studentData.department = profileData.department;
        if (profileData.batch) studentData.batch = profileData.batch;
        if (profileData.currentSemester) studentData.currentSemester = profileData.currentSemester;
        if (profileData.address !== undefined) studentData.address = profileData.address;
        if (profileData.assignedCounselorId !== undefined) studentData.assignedCounselorId = profileData.assignedCounselorId || null;
        if (profileData.emergencyContactName !== undefined) studentData.emergencyContactName = profileData.emergencyContactName;
        if (profileData.emergencyContactPhone !== undefined) studentData.emergencyContactPhone = profileData.emergencyContactPhone;
        if (profileData.emergencyContactRelationship !== undefined) studentData.emergencyContactRelationship = profileData.emergencyContactRelationship;

        if (Object.keys(studentData).length > 0) {
          await tx.student.update({
            where: { userId: id },
            data: studentData
          });
        }
      }

      if (existingUser.role === 'COUNSELOR' && existingUser.counselor) {
        const counselorData = {};
        if (profileData.department) counselorData.department = profileData.department;
        if (profileData.specialization) counselorData.specialization = Array.isArray(profileData.specialization) ? profileData.specialization : [profileData.specialization];
        if (profileData.officeLocation !== undefined) counselorData.officeLocation = profileData.officeLocation;
        if (profileData.officeHours !== undefined) counselorData.officeHours = profileData.officeHours;
        if (profileData.yearsOfExperience !== undefined) counselorData.yearsOfExperience = parseInt(profileData.yearsOfExperience);
        if (profileData.maxStudentsCapacity !== undefined) counselorData.maxStudentsCapacity = parseInt(profileData.maxStudentsCapacity);
        if (profileData.address !== undefined) counselorData.address = profileData.address;

        if (Object.keys(counselorData).length > 0) {
          await tx.counselor.update({
            where: { userId: id },
            data: counselorData
          });
        }
      }

      return user;
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        role: result.role.toLowerCase(),
        updatedAt: result.updatedAt
      }
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile"
    });
  }
});

// =========================================================================
// DELETE /api/users/:id - Delete user (Chairperson only)
// =========================================================================
router.delete("/:id", protect(), requireChairperson, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deleting chairperson accounts
    if (existingUser.role === 'CHAIRPERSON') {
      return res.status(400).json({
        success: false,
        message: "Cannot delete chairperson accounts"
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    });
  }
});

// =========================================================================
// PATCH /api/users/:id/status - Toggle user active status (Chairperson only)
// =========================================================================
router.patch("/:id/status", protect(), requireChairperson, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deactivating chairperson accounts
    if (existingUser.role === 'CHAIRPERSON') {
      return res.status(400).json({
        success: false,
        message: "Cannot deactivate chairperson accounts"
      });
    }

    // Toggle active status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        isActive: !existingUser.isActive,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isActive: updatedUser.isActive
      }
    });
  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status"
    });
  }
});

export default router;