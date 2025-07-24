import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const protect = (roles = []) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res
          .status(401)
          .json({ 
            success: false,
            message: "No token, authorization denied" 
          });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          student: true,
          counselor: true,
        },
      });

      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: "User not found" 
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          success: false,
          message: "Account has been deactivated" 
        });
      }

      // Check if user role is allowed (if roles are specified)
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false,
          message: "Access denied - insufficient permissions" 
        });
      }

      // Attach user and token to request
      req.user = user;
      req.token = token;

      next();
    } catch (err) {
      console.error("Authentication error:", err);

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({ 
          success: false,
          message: "Invalid token" 
        });
      }

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ 
          success: false,
          message: "Token expired" 
        });
      }

      res.status(500).json({ 
        success: false,
        message: "Server error during authentication" 
      });
    }
  };
};
