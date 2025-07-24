import express from "express";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middlewares/authMiddleware.js";
import { requireCounselorOrChairperson } from "../middlewares/roleMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// =========================================================================
// GET /api/students/:studentId/notes - Get notes for a student
// =========================================================================
router.get("/students/:studentId/notes", protect(), requireCounselorOrChairperson, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { user } = req;
    
    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { userId: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // For counselors, check if they are assigned to this student
    if (user.role === 'COUNSELOR' && student.assignedCounselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only view notes for your assigned students"
      });
    }

    // Get notes with privacy filter
    // - Chairperson can see all notes
    // - Counselors can see their own private notes and all shared notes
    const whereClause = {
      studentId: student.id,
      ...(user.role === 'COUNSELOR' && {
        OR: [
          { counselorId: user.id }, // Own notes (private or shared)
          { isPrivate: false }      // Other counselors' shared notes
        ]
      })
    };

    const notes = await prisma.studentNote.findMany({
      where: whereClause,
      include: {
        counselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format notes for response
    const formattedNotes = notes.map(note => ({
      id: note.id,
      category: note.category.toLowerCase(),
      content: note.content,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      createdBy: note.counselor.name,
      counselorId: note.counselorId,
      counselorEmail: note.counselor.email
    }));

    res.json({
      success: true,
      data: formattedNotes
    });
  } catch (error) {
    console.error("Get student notes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student notes"
    });
  }
});

// =========================================================================
// POST /api/students/:studentId/notes - Create a new note for a student
// =========================================================================
router.post("/students/:studentId/notes", protect(), requireCounselorOrChairperson, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { user } = req;
    const { category, content, isPrivate = true } = req.body;

    // Validate required fields
    if (!category || !content) {
      return res.status(400).json({
        success: false,
        message: "Category and content are required"
      });
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { userId: studentId }
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // For counselors, check if they are assigned to this student
    if (user.role === 'COUNSELOR' && student.assignedCounselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only add notes for your assigned students"
      });
    }

    // Create note
    const note = await prisma.studentNote.create({
      data: {
        studentId: student.id,
        counselorId: user.id,
        category: category.toUpperCase(),
        content,
        isPrivate: !!isPrivate
      },
      include: {
        counselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format response
    const formattedNote = {
      id: note.id,
      category: note.category.toLowerCase(),
      content: note.content,
      isPrivate: note.isPrivate,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      createdBy: note.counselor.name,
      counselorId: note.counselorId,
      counselorEmail: note.counselor.email
    };

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: formattedNote
    });
  } catch (error) {
    console.error("Create note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create note"
    });
  }
});

// =========================================================================
// PUT /api/notes/:noteId - Update a note
// =========================================================================
router.put("/notes/:noteId", protect(), requireCounselorOrChairperson, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { user } = req;
    const { category, content, isPrivate } = req.body;

    // Find the note
    const note = await prisma.studentNote.findUnique({
      where: { id: noteId },
      include: {
        student: true
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    // Check permissions
    // - Chairperson can edit any note
    // - Counselors can only edit their own notes
    if (user.role === 'COUNSELOR' && note.counselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only edit your own notes"
      });
    }

    // Update note
    const updatedNote = await prisma.studentNote.update({
      where: { id: noteId },
      data: {
        ...(category && { category: category.toUpperCase() }),
        ...(content !== undefined && { content }),
        ...(isPrivate !== undefined && { isPrivate }),
        updatedAt: new Date()
      },
      include: {
        counselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Format response
    const formattedNote = {
      id: updatedNote.id,
      category: updatedNote.category.toLowerCase(),
      content: updatedNote.content,
      isPrivate: updatedNote.isPrivate,
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
      createdBy: updatedNote.counselor.name,
      counselorId: updatedNote.counselorId,
      counselorEmail: updatedNote.counselor.email
    };

    res.json({
      success: true,
      message: "Note updated successfully",
      data: formattedNote
    });
  } catch (error) {
    console.error("Update note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update note"
    });
  }
});

// =========================================================================
// DELETE /api/notes/:noteId - Delete a note
// =========================================================================
router.delete("/notes/:noteId", protect(), requireCounselorOrChairperson, async (req, res) => {
  try {
    const { noteId } = req.params;
    const { user } = req;

    // Find the note
    const note = await prisma.studentNote.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found"
      });
    }

    // Check permissions
    // - Chairperson can delete any note
    // - Counselors can only delete their own notes
    if (user.role === 'COUNSELOR' && note.counselorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied - you can only delete your own notes"
      });
    }

    // Delete note
    await prisma.studentNote.delete({
      where: { id: noteId }
    });

    res.json({
      success: true,
      message: "Note deleted successfully"
    });
  } catch (error) {
    console.error("Delete note error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete note"
    });
  }
});

export default router;