import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middlewares/authMiddleware.js";
import { requireStudentOrCounselor } from "../middlewares/roleMiddleware.js";
import { createNotification } from "./notificationRoutes.js";
import path from "path";
import fs from "fs";

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================
// GET /api/conversations - Get user's conversations
// =========================================================================
router.get("/conversations", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      },
      include: {
        participant1: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            student: {
              select: {
                studentId: true,
                department: true
              }
            },
            counselor: {
              select: {
                employeeId: true,
                department: true
              }
            }
          }
        },
        participant2: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            student: {
              select: {
                studentId: true,
                department: true
              }
            },
            counselor: {
              select: {
                employeeId: true,
                department: true
              }
            }
          }
        },
        lastMessage: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // Format conversations to include other participant info
    const formattedConversations = conversations.map(conversation => {
      // Determine which participant is the other user
      const otherParticipant = conversation.participant1Id === userId 
        ? conversation.participant2 
        : conversation.participant1;

      return {
        id: conversation.id,
        otherUser: {
          id: otherParticipant.id,
          name: otherParticipant.name,
          email: otherParticipant.email,
          role: otherParticipant.role.toLowerCase(),
          ...(otherParticipant.role === 'STUDENT' && otherParticipant.student && {
            studentId: otherParticipant.student.studentId,
            department: otherParticipant.student.department
          }),
          ...(otherParticipant.role === 'COUNSELOR' && otherParticipant.counselor && {
            employeeId: otherParticipant.counselor.employeeId,
            department: otherParticipant.counselor.department
          })
        },
        lastMessage: conversation.lastMessage ? {
          id: conversation.lastMessage.id,
          content: conversation.lastMessage.content,
          senderId: conversation.lastMessage.senderId,
          isRead: conversation.lastMessage.isRead,
          createdAt: conversation.lastMessage.createdAt
        } : null,
        unreadCount: conversation.unreadCount,
        updatedAt: conversation.updatedAt,
        createdAt: conversation.createdAt
      };
    });

    res.json({
      success: true,
      data: formattedConversations
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations"
    });
  }
});

// =========================================================================
// GET /api/conversations/:id/messages - Get messages in a conversation
// =========================================================================
router.get("/conversations/:id/messages", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you don't have access"
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        attachment: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Mark unread messages as read if user is the receiver
    await prisma.$transaction(async (tx) => {
      await tx.message.updateMany({
        where: {
          conversationId: id,
          receiverId: userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      // Update conversation unread count
      await tx.conversation.update({
        where: { id },
        data: { unreadCount: 0 }
      });
    });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        role: message.sender.role.toLowerCase()
      },
      attachment: message.attachment ? {
        id: message.attachment.id,
        filename: message.attachment.filename,
        originalName: message.attachment.originalName,
        mimeType: message.attachment.mimeType,
        url: message.attachment.url
      } : null,
      isRead: message.isRead,
      createdAt: message.createdAt
    }));

    res.json({
      success: true,
      data: formattedMessages
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages"
    });
  }
});

// =========================================================================
// POST /api/conversations/:id/messages - Send a message in a conversation
// =========================================================================
router.post("/conversations/:id/messages", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, attachmentId } = req.body;
    const userId = req.user.id;

    if (!content && !attachmentId) {
      return res.status(400).json({
        success: false,
        message: "Message content or attachment is required"
      });
    }

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you don't have access"
      });
    }

    // Determine receiver ID (the other participant)
    const receiverId = conversation.participant1Id === userId 
      ? conversation.participant2Id 
      : conversation.participant1Id;

    // Create message and update conversation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create message
      const message = await tx.message.create({
        data: {
          conversationId: id,
          senderId: userId,
          receiverId,
          content: content || "",
          attachmentId
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          attachment: true
        }
      });

      // Update conversation with last message and increment unread count
      await tx.conversation.update({
        where: { id },
        data: {
          lastMessageId: message.id,
          unreadCount: {
            increment: 1
          },
          updatedAt: new Date()
        }
      });

      return message;
    });

    // Format response
    const formattedMessage = {
      id: result.id,
      content: result.content,
      sender: {
        id: result.sender.id,
        name: result.sender.name,
        role: result.sender.role.toLowerCase()
      },
      attachment: result.attachment ? {
        id: result.attachment.id,
        filename: result.attachment.filename,
        originalName: result.attachment.originalName,
        mimeType: result.attachment.mimeType,
        url: result.attachment.url
      } : null,
      isRead: result.isRead,
      createdAt: result.createdAt
    };
    
    // Create notification for message recipient
    try {
      await createNotification(prisma, {
        userId: receiverId,
        type: "MESSAGE",
        title: `New message from ${result.sender.name}`,
        message: content.length > 50 ? `${content.substring(0, 50)}...` : content,
        relatedId: result.id,
        relatedType: "message"
      });
    } catch (error) {
      console.error("Failed to create message notification:", error);
      // Continue execution even if notification creation fails
    }

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: formattedMessage
    });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message"
    });
  }
});

// =========================================================================
// POST /api/conversations - Start a new conversation
// =========================================================================
router.post("/conversations", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { participantId, initialMessage } = req.body;
    const userId = req.user.id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required"
      });
    }

    // Check if participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is allowed to message this participant
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        counselor: true
      }
    });

    let canMessage = false;

    // If current user is a student, they can only message their assigned counselor
    if (currentUser.role === 'STUDENT' && participant.role === 'COUNSELOR') {
      if (currentUser.student && currentUser.student.assignedCounselorId === participantId) {
        canMessage = true;
      }
    }
    // If current user is a counselor, they can only message their assigned students
    else if (currentUser.role === 'COUNSELOR' && participant.role === 'STUDENT') {
      if (participant.student && participant.student.assignedCounselorId === userId) {
        canMessage = true;
      }
    }

    if (!canMessage) {
      return res.status(403).json({
        success: false,
        message: "You can only message your assigned counselor/students"
      });
    }

    // Check if conversation already exists
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participant1Id: userId,
            participant2Id: participantId
          },
          {
            participant1Id: participantId,
            participant2Id: userId
          }
        ]
      }
    });

    if (existingConversation) {
      return res.status(400).json({
        success: false,
        message: "Conversation already exists",
        data: { conversationId: existingConversation.id }
      });
    }

    // Create conversation and initial message if provided
    const result = await prisma.$transaction(async (tx) => {
      // Create conversation
      const conversation = await tx.conversation.create({
        data: {
          participant1Id: userId,
          participant2Id: participantId
        }
      });

      // Create initial message if provided
      let message = null;
      if (initialMessage) {
        message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId: userId,
            receiverId: participantId,
            content: initialMessage
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });

        // Update conversation with last message
        await tx.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessageId: message.id,
            unreadCount: 1
          }
        });
      }

      return { conversation, message };
    });

    // Format response
    const response = {
      success: true,
      message: "Conversation started successfully",
      data: {
        conversation: {
          id: result.conversation.id,
          participant1Id: result.conversation.participant1Id,
          participant2Id: result.conversation.participant2Id,
          createdAt: result.conversation.createdAt
        }
      }
    };

    if (result.message) {
      response.data.initialMessage = {
        id: result.message.id,
        content: result.message.content,
        sender: {
          id: result.message.sender.id,
          name: result.message.sender.name,
          role: result.message.sender.role.toLowerCase()
        },
        isRead: result.message.isRead,
        createdAt: result.message.createdAt
      };
      
      // Create notification for initial message
      try {
        await createNotification(prisma, {
          userId: participantId,
          type: "MESSAGE",
          title: `New conversation with ${result.message.sender.name}`,
          message: initialMessage.length > 50 ? `${initialMessage.substring(0, 50)}...` : initialMessage,
          relatedId: result.message.id,
          relatedType: "message"
        });
      } catch (error) {
        console.error("Failed to create initial message notification:", error);
        // Continue execution even if notification creation fails
      }
    }

    res.status(201).json(response);
  } catch (error) {
    console.error("Start conversation error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start conversation"
    });
  }
});

// =========================================================================
// GET /api/messages/search-users - Search for users to message
// =========================================================================
router.get("/messages/search-users", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user.id;
    
    // Get current user with their role-specific data
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        counselor: true
      }
    });

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    let users = [];

    // If user is a student, they can only message their assigned counselor
    if (currentUser.role === 'STUDENT') {
      if (!currentUser.student || !currentUser.student.assignedCounselorId) {
        return res.json({
          success: true,
          message: "No assigned counselor found",
          data: []
        });
      }

      const counselor = await prisma.user.findUnique({
        where: { id: currentUser.student.assignedCounselorId },
        include: {
          counselor: true
        }
      });

      if (counselor) {
        // Always include the counselor, regardless of search term
        users = [{
          id: counselor.id,
          name: counselor.name,
          email: counselor.email,
          role: counselor.role.toLowerCase(),
          employeeId: counselor.counselor?.employeeId,
          department: counselor.counselor?.department
        }];
      }
    } 
    // If user is a counselor, they can only message their assigned students
    else if (currentUser.role === 'COUNSELOR') {
      // Get all assigned students, then filter by search if provided
      const whereClause = {
        assignedCounselorId: userId
      };
      
      // Only add search filter if search term is provided
      if (search && search.trim() !== '') {
        whereClause.user = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        };
      }
      
      const students = await prisma.student.findMany({
        where: whereClause,
        include: {
          user: true
        },
        orderBy: {
          user: {
            name: 'asc'  // Sort alphabetically by name
          }
        }
      });

      users = students.map(student => ({
        id: student.user.id,
        name: student.user.name,
        email: student.user.email,
        role: student.user.role.toLowerCase(),
        studentId: student.studentId,
        department: student.department
      }));
    }

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search users"
    });
  }
});

// =========================================================================
// PATCH /api/messages/:id/read - Mark a message as read
// =========================================================================
router.patch("/messages/:id/read", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if message exists and user is the receiver
    const message = await prisma.message.findFirst({
      where: {
        id,
        receiverId: userId
      },
      include: {
        conversation: true
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found or you don't have permission"
      });
    }

    // Mark message as read
    await prisma.$transaction(async (tx) => {
      await tx.message.update({
        where: { id },
        data: { isRead: true }
      });

      // Update conversation unread count if needed
      if (!message.isRead) {
        await tx.conversation.update({
          where: { id: message.conversationId },
          data: {
            unreadCount: {
              decrement: 1
            }
          }
        });
      }
    });

    res.json({
      success: true,
      message: "Message marked as read"
    });
  } catch (error) {
    console.error("Mark message as read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark message as read"
    });
  }
});

// =========================================================================
// POST /api/conversations/:id/files - Upload file to conversation
// =========================================================================
router.post("/conversations/:id/files", protect(), requireStudentOrCounselor, (req, res) => {
  const upload = req.app.locals.upload;
  
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      const { id: conversationId } = req.params;
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      // Check if conversation exists and user is a participant
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participant1Id: userId },
            { participant2Id: userId }
          ]
        }
      });

      if (!conversation) {
        // Delete uploaded file if conversation not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: "Conversation not found or you don't have access"
        });
      }

      // Create attachment record
      const attachment = await prisma.attachment.create({
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          url: `/uploads/${req.file.filename}`,
          conversationId: conversationId,
          uploadedById: userId
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          id: attachment.id,
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          url: attachment.url,
          uploadedBy: attachment.uploadedBy.name,
          uploadedById: attachment.uploadedById,
          createdAt: attachment.createdAt
        }
      });
    } catch (error) {
      console.error("File upload error:", error);
      // Delete uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: "Failed to upload file"
      });
    }
  });
});

// =========================================================================
// GET /api/conversations/:id/files - Get files for conversation
// =========================================================================
router.get("/conversations/:id/files", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user.id;

    // Check if conversation exists and user is a participant
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { participant1Id: userId },
          { participant2Id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or you don't have access"
      });
    }

    // Get files for this conversation
    const files = await prisma.attachment.findMany({
      where: {
        conversationId: conversationId
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedFiles = files.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.originalName,
      mimeType: file.mimeType,
      size: file.size,
      url: file.url,
      uploadedBy: file.uploadedBy.name,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt
    }));

    res.json({
      success: true,
      data: formattedFiles
    });
  } catch (error) {
    console.error("Get conversation files error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch files"
    });
  }
});

// =========================================================================
// GET /api/files/:id/download - Download file
// =========================================================================
router.get("/files/:id/download", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id: fileId } = req.params;
    const userId = req.user.id;

    // Get file and check permissions
    const file = await prisma.attachment.findFirst({
      where: {
        id: fileId
      },
      include: {
        conversation: true
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    // Check if user has access to this conversation
    const hasAccess = file.conversation.participant1Id === userId || 
                     file.conversation.participant2Id === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server"
      });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error("File download error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download file"
    });
  }
});

// =========================================================================
// DELETE /api/files/:id - Delete file
// =========================================================================
router.delete("/files/:id", protect(), requireStudentOrCounselor, async (req, res) => {
  try {
    const { id: fileId } = req.params;
    const userId = req.user.id;

    // Get file and check permissions
    const file = await prisma.attachment.findFirst({
      where: {
        id: fileId,
        uploadedById: userId // Only uploader can delete
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found or you don't have permission to delete it"
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.attachment.delete({
      where: {
        id: fileId
      }
    });

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("File delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete file"
    });
  }
});

export default router;