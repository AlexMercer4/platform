// Role-based access control middleware

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(", ")}`
      });
    }

    next();
  };
};

// Specific role middlewares for convenience
export const requireStudent = requireRole("STUDENT");
export const requireCounselor = requireRole("COUNSELOR");
export const requireChairperson = requireRole("CHAIRPERSON");

// Combined role middlewares
export const requireCounselorOrChairperson = requireRole("COUNSELOR", "CHAIRPERSON");
export const requireStudentOrCounselor = requireRole("STUDENT", "COUNSELOR");

// Resource ownership middleware
export const requireOwnership = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // Chairperson can access all resources
    if (req.user.role === "CHAIRPERSON") {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.params.id || req.body[resourceUserIdField] || req.query[resourceUserIdField];
    
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only access your own resources"
      });
    }

    next();
  };
};

// Student access middleware (student can access their own data, counselor can access assigned students)
export const requireStudentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required"
    });
  }

  const studentId = req.params.studentId || req.params.id;

  // Chairperson can access all students
  if (req.user.role === "CHAIRPERSON") {
    return next();
  }

  // Student can access their own data
  if (req.user.role === "STUDENT" && req.user.id === studentId) {
    return next();
  }

  // Counselor can access assigned students
  if (req.user.role === "COUNSELOR") {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      
      const student = await prisma.student.findUnique({
        where: { userId: studentId }
      });

      if (student && student.assignedCounselorId === req.user.id) {
        return next();
      }
    } catch (error) {
      console.error("Error checking student access:", error);
      return res.status(500).json({
        success: false,
        message: "Server error checking permissions"
      });
    }
  }

  return res.status(403).json({
    success: false,
    message: "Access denied - insufficient permissions for this student"
  });
};