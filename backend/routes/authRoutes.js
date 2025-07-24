import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { authValidation } from "../middlewares/validationMiddleware.js";

// =========================================================================

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================

router.get("/me", async (req, res) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }

    // Fetch complete user profile from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        student: true,
        counselor: true,
      },
    });

    if (!user) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        // Include profile data based on role
        ...(user.role === "STUDENT" && user.student && {
          studentId: user.student.studentId,
          department: user.student.department,
          batch: user.student.batch,
          currentSemester: user.student.currentSemester,
          cgpa: user.student.cgpa,
          enrollmentDate: user.student.enrollmentDate,
          assignedCounselorId: user.student.assignedCounselorId,
        }),
        ...(user.role === "COUNSELOR" && user.counselor && {
          employeeId: user.counselor.employeeId,
          department: user.counselor.department,
          specialization: user.counselor.specialization,
          officeLocation: user.counselor.officeLocation,
          officeHours: user.counselor.officeHours,
          yearsOfExperience: user.counselor.yearsOfExperience,
          maxStudentsCapacity: user.counselor.maxStudentsCapacity,
          currentStudentsCount: user.counselor.currentStudentsCount,
        }),
      },
    });
  } catch (err) {
    console.error("Auth /me error:", err);
    res.status(401).json({ valid: false, message: "Invalid token" });
  }
});

// =========================================================================

router.post("/register", authValidation.register, async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    department,
    studentId,
    employeeId,
    batch,
    currentSemester,
    specialization,
    officeLocation
  } = req.body;

  try {
    if (!["STUDENT", "COUNSELOR", "CHAIRPERSON"].includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid role specified"
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone,
          role: role.toUpperCase(),
          isActive: true
        },
      });

      // Create profile based on role
      if (role.toUpperCase() === 'STUDENT') {
        await tx.student.create({
          data: {
            userId: user.id,
            studentId: studentId || `STU-${Date.now()}`,
            department: department || 'General',
            batch: batch || 'Current',
            currentSemester: currentSemester || '1st Semester',
            enrollmentDate: new Date()
          }
        });
      } else if (role.toUpperCase() === 'COUNSELOR') {
        await tx.counselor.create({
          data: {
            userId: user.id,
            employeeId: employeeId || `EMP-${Date.now()}`,
            department: department || 'Counseling',
            specialization: Array.isArray(specialization) ? specialization : ['General Counseling'],
            officeLocation,
            maxStudentsCapacity: 40,
            currentStudentsCount: 0
          }
        });
      }

      return user;
    });

    const token = jwt.sign(
      {
        email: result.email,
        id: result.id,
        role: result.role.toLowerCase(),
        name: result.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      success: true,
      token,
      message: "Registration successful",
      user: {
        id: result.id,
        name: result.name,
        email: result.email,
        role: result.role.toLowerCase(),
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// =========================================================================

router.post("/login", authValidation.login, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: true,
        counselor: true,
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      {
        email: user.email,
        id: user.id,
        role: user.role.toLowerCase(),
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role.toLowerCase(),
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        // Include profile data based on role
        ...(user.role === "STUDENT" && user.student && {
          studentId: user.student.studentId,
          department: user.student.department,
          batch: user.student.batch,
          currentSemester: user.student.currentSemester,
        }),
        ...(user.role === "COUNSELOR" && user.counselor && {
          employeeId: user.counselor.employeeId,
          department: user.counselor.department,
          specialization: user.counselor.specialization,
        }),
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

// =========================================================================

router.post("/logout", async (req, res) => {
  try {
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =========================================================================

router.post("/forgot-password", authValidation.forgotPassword, async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent.",
      // Remove this in production - only for development
      resetToken: process.env.NODE_ENV === "development" ? resetToken : undefined
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// =========================================================================

router.post("/reset-password", authValidation.resetPassword, async (req, res) => {
  const { token, password } = req.body;

  try {
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }
    res.status(500).json({ message: "Server Error" });
  }
});

// =========================================================================

export default router;
