# Backend Development Tasks

## Phase 1: Database & Authentication Setup ✅ COMPLETED

### Task 1.1: Database Schema Updates ✅ COMPLETED
- [x] Update Prisma schema with enhanced User model
- [x] Add Student profile model with all required fields
- [x] Add Counselor profile model with specialization array
- [x] Update Appointment model with proper enums and relationships
- [x] Add Conversation and Message models for messaging system
- [x] Add StudentNote model with categories and privacy controls
- [x] Add Attachment model for file uploads
- [x] Create database migration for schema changes
- [x] Run migration and verify database structure

### Task 1.2: Enhanced Authentication System ✅ COMPLETED
- [x] Update `/api/auth/me` endpoint to return complete user profile data
- [x] Add `/api/auth/forgot-password` endpoint for password reset requests
- [x] Add `/api/auth/reset-password` endpoint for password reset with token
- [x] Enhance existing login/register endpoints with better error handling
- [x] Update JWT payload to include additional user information
- [x] Add email service utility for password reset emails (basic implementation)

### Task 1.3: Middleware Enhancements ✅ COMPLETED
- [x] Enhance existing `authMiddleware.js` with better error handling
- [x] Create `roleMiddleware.js` for role-based access control
- [x] Create `validationMiddleware.js` for request validation
- [x] Create `uploadMiddleware.js` for file upload handling
- [x] Add proper error response formatting

## Phase 2: User Management System ✅ COMPLETED

### Task 2.1: User Management Routes (`/api/users`) ✅ COMPLETED
- [x] Create `userRoutes.js` file
- [x] Add `GET /users` - Get all users with role-based filtering (Chairperson only)
- [x] Add `POST /users/students` - Create new student (Chairperson only)
- [x] Add `POST /users/counselors` - Create new counselor (Chairperson only)
- [x] Add `PUT /users/:id` - Update user profile
- [x] Add `DELETE /users/:id` - Delete user (Chairperson only)
- [x] Add `PATCH /users/:id/status` - Toggle user active status (Chairperson only)
- [x] Business logic implemented directly in routes (keeping it simple)
- [x] Add proper validation for all user operations

### Task 2.2: Student Profile Management ✅ COMPLETED
- [x] Create `studentRoutes.js` file
- [x] Add `GET /students` - Get students list (Counselors/Chairperson)
- [x] Add `GET /students/:id` - Get student details
- [x] Add `PUT /students/:id` - Update student profile
- [x] Add `GET /students/assigned` - Get counselor's assigned students
- [x] Implement student-counselor assignment logic
- [x] Add validation for student-specific fields

### Task 2.3: Counselor Profile Management ✅ COMPLETED
- [x] Create `counselorRoutes.js` file
- [x] Add `GET /counselors` - Get counselors list
- [x] Add `GET /counselors/:id` - Get counselor details
- [x] Add `PUT /counselors/:id` - Update counselor profile
- [x] Implement counselor capacity management
- [x] Add validation for counselor-specific fields

## Phase 3: Core Features Implementation

### Task 3.1: Appointment Management System
- [ ] Create `appointmentRoutes.js` file
- [ ] Add `GET /appointments` - Get appointments with role-based filtering
- [ ] Add `POST /appointments` - Create new appointment
- [ ] Add `PUT /appointments/:id` - Update appointment (reschedule)
- [ ] Add `PATCH /appointments/:id/status` - Update appointment status
- [ ] Add `DELETE /appointments/:id` - Cancel appointment
- [ ] Create `appointmentController.js` with business logic
- [ ] Implement appointment conflict checking
- [ ] Add appointment status validation
- [ ] Calculate session hours from completed appointments

### Task 3.2: Dashboard Statistics System
- [ ] Create `dashboardRoutes.js` file
- [ ] Add `GET /dashboard/stats` - Get role-based dashboard statistics
- [ ] Add `GET /dashboard/appointments` - Get recent appointments
- [ ] Add `GET /dashboard/messages` - Get recent messages
- [ ] Create `dashboardController.js` with statistics calculations
- [ ] Implement student dashboard stats (upcoming appointments, unread messages, session hours)
- [ ] Implement counselor dashboard stats (today's appointments, active students, session hours)
- [ ] Implement chairperson dashboard stats (total/active students and counselors)

## Phase 4: Interactive Features

### Task 4.1: Messaging System
- [ ] Create `messageRoutes.js` file
- [ ] Add `GET /conversations` - Get user's conversations
- [ ] Add `POST /conversations` - Start new conversation
- [ ] Add `GET /conversations/:id/messages` - Get conversation messages
- [ ] Add `POST /conversations/:id/messages` - Send message
- [ ] Add `PATCH /messages/:id/read` - Mark message as read
- [ ] Create `messageController.js` with messaging logic
- [ ] Implement conversation creation and management
- [ ] Add unread message counting
- [ ] Implement message pagination

### Task 4.2: Student Notes System
- [ ] Create `noteRoutes.js` file
- [ ] Add `GET /students/:id/notes` - Get student notes
- [ ] Add `POST /students/:id/notes` - Create new note
- [ ] Add `PUT /notes/:id` - Update note
- [ ] Add `DELETE /notes/:id` - Delete note
- [ ] Create `noteController.js` with notes logic
- [ ] Implement privacy controls for notes
- [ ] Add note categorization
- [ ] Implement counselor access validation

## Phase 5: File Management & Analytics

### Task 5.1: File Upload System
- [ ] Create `uploadRoutes.js` file
- [ ] Add `POST /upload` - Upload file attachment
- [ ] Add `GET /files/:id` - Download file
- [ ] Add `DELETE /files/:id` - Delete file
- [ ] Add `GET /conversations/:id/files` - Get conversation files
- [ ] Create `uploads/` directory for file storage
- [ ] Create `fileUtils.js` utility functions
- [ ] Implement file type and size validation
- [ ] Add file security measures
- [ ] Implement file cleanup for deleted records

### Task 5.2: Analytics System
- [ ] Create `analyticsRoutes.js` file
- [ ] Add `GET /analytics/appointments` - Get appointment analytics
- [ ] Add `GET /analytics/students` - Get student analytics
- [ ] Create `analyticsController.js` with analytics calculations
- [ ] Implement appointment trends and statistics
- [ ] Implement student engagement metrics
- [ ] Add time-based filtering for analytics
- [ ] Calculate department-wise statistics

## Phase 6: Server Configuration & Utilities

### Task 6.1: Server Enhancement
- [ ] Update `server.js` to include all new routes
- [ ] Add proper error handling middleware
- [ ] Configure file upload middleware (multer)
- [ ] Add request logging middleware
- [ ] Configure proper CORS settings
- [ ] Add rate limiting middleware

### Task 6.2: Utility Functions
- [ ] Create `emailService.js` for email notifications
- [ ] Create `dateUtils.js` for date/time operations
- [ ] Create `fileUtils.js` for file operations
- [ ] Add input validation utilities
- [ ] Add response formatting utilities

### Task 6.3: Database Seeding
- [ ] Create `prisma/seed.js` file
- [ ] Add sample users (students, counselors, chairperson)
- [ ] Add sample appointments
- [ ] Add sample conversations and messages
- [ ] Add sample student notes
- [ ] Configure seeding script in package.json

## Phase 7: Package Dependencies

### Task 7.1: Add Required Dependencies
- [ ] Add `multer` for file uploads
- [ ] Add `nodemailer` for email services
- [ ] Add `joi` or `zod` for validation
- [ ] Add `helmet` for security headers
- [ ] Add `express-rate-limit` for rate limiting
- [ ] Add `morgan` for request logging
- [ ] Update package.json with new dependencies

## Phase 8: Environment & Configuration

### Task 8.1: Environment Configuration
- [ ] Update `.env` file with new environment variables
- [ ] Add email service configuration
- [ ] Add file upload configuration
- [ ] Add JWT secret and expiration settings
- [ ] Add database connection settings
- [ ] Add CORS origin settings

### Task 8.2: Error Handling & Validation
- [ ] Implement global error handling middleware
- [ ] Add consistent API response format
- [ ] Add input validation for all endpoints
- [ ] Add proper HTTP status codes
- [ ] Add user-friendly error messages
- [ ] Add logging for errors and important events

## Task Priority & Dependencies

### High Priority (Must Complete First)
1. **Task 1.1** - Database Schema Updates (Required for all other tasks)
2. **Task 1.2** - Enhanced Authentication System (Required for authorization)
3. **Task 1.3** - Middleware Enhancements (Required for security)

### Medium Priority (Core Functionality)
4. **Task 2.1** - User Management Routes
5. **Task 3.1** - Appointment Management System
6. **Task 3.2** - Dashboard Statistics System

### Standard Priority (Feature Complete)
7. **Task 2.2** - Student Profile Management
8. **Task 2.3** - Counselor Profile Management
9. **Task 4.1** - Messaging System
10. **Task 4.2** - Student Notes System

### Lower Priority (Enhancement Features)
11. **Task 5.1** - File Upload System
12. **Task 5.2** - Analytics System
13. **Task 6.1** - Server Enhancement
14. **Task 6.2** - Utility Functions

### Setup & Configuration (Can be done in parallel)
15. **Task 6.3** - Database Seeding
16. **Task 7.1** - Add Required Dependencies
17. **Task 8.1** - Environment Configuration
18. **Task 8.2** - Error Handling & Validation

## Completion Checklist

### Phase 1 Complete When:
- [ ] Database schema matches frontend requirements
- [ ] Authentication system enhanced with password reset
- [ ] All middleware properly configured

### Phase 2 Complete When:
- [ ] User management system fully functional
- [ ] Student and counselor profiles working
- [ ] Role-based access control implemented

### Phase 3 Complete When:
- [ ] Appointment system fully operational
- [ ] Dashboard showing real-time statistics
- [ ] All CRUD operations working

### Phase 4 Complete When:
- [ ] Messaging system functional
- [ ] Student notes system working
- [ ] Privacy controls implemented

### Phase 5 Complete When:
- [ ] File upload/download working
- [ ] Analytics endpoints returning data
- [ ] All frontend API calls successful

### Final Completion When:
- [ ] All endpoints tested and working
- [ ] Database properly seeded
- [ ] Error handling comprehensive
- [ ] Security measures implemented
- [ ] Frontend successfully connects to all endpoints

## Notes
- Each task should be completed and tested before moving to the next
- Database migrations should be created for each schema change
- All endpoints should include proper authentication and authorization
- Error handling should be consistent across all endpoints
- API responses should match frontend service expectations