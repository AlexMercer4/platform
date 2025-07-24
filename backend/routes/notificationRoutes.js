import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Helper function to create a notification
 * @param {PrismaClient} prismaClient - Prisma client instance
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
export const createNotification = async (prismaClient, data) => {
  try {
    const notification = await prismaClient.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
      }
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Don't throw error to prevent disrupting the main operation
    return null;
  }
};

// =========================================================================
// GET /api/notifications - Get user's notifications with pagination
// =========================================================================
router.get("/", protect(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Build filter
    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }
    
    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: filter,
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
    
    // Get total count for pagination
    const totalCount = await prisma.notification.count({ where: filter });
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications"
    });
  }
});

// =========================================================================
// GET /api/notifications/unread-count - Get count of unread notifications
// =========================================================================
router.get("/unread-count", protect(), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Count unread notifications
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    
    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread notification count"
    });
  }
});

// =========================================================================
// PATCH /api/notifications/:id/read - Mark a single notification as read
// =========================================================================
router.patch("/:id/read", protect(), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId
      }
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    
    // Mark as read
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    res.json({
      success: true,
      data: updatedNotification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read"
    });
  }
});

// =========================================================================
// PATCH /api/notifications/read-all - Mark all notifications as read
// =========================================================================
router.patch("/read-all", protect(), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Mark all user's notifications as read
    const { count } = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
    
    res.json({
      success: true,
      message: `Marked ${count} notifications as read`
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read"
    });
  }
});

// =========================================================================
// GET /api/notifications/all - Get all notifications (for "View All" page)
// =========================================================================
router.get("/all", protect(), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    // Get all notifications with pagination
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    });
    
    // Get total count for pagination
    const totalCount = await prisma.notification.count({ where: { userId } });
    
    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error getting all notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get all notifications"
    });
  }
});

export default router;