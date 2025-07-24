# Backend Development Plan: Counseling Platform API

## Overview
This plan outlines the development of a simple Express.js backend API for the counseling platform. The backend will provide RESTful endpoints to support the frontend's data requirements while maintaining simplicity and avoiding over-engineering.

## Current Backend Analysis

### Existing Technology Stack
- **Framework**: Express.js 5.1.0
- **Database**: PostgreSQL with Prisma ORM 6.7.0
- **Authentication**: JWT with bcrypt for password hashing
- **File Handling**: Basic setup (needs enhancement)
- **Development**: Nodemon for hot reloading

### Current Database Schema Status
The existing Prisma schema has basic User and Appointment models but needs significant expansion to match frontend requirements.

## Required Database Schema Updates

### 1. Enhanced User Model
```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  email     String   @unique
  password  String
  phone     String?
  role      Role
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  lastLogin DateTime?

  // Relations
  student   Student?
  counselor Counselor?
  
  // Appointment relations
  studentAppointments   Appointment[] @relation("StudentAppointments")
  counselorAppointments Appointment[] @relation("CounselorAppointments")
  
  // Message relations
  sentMessages     Message[] @relation("SentMessages")
  receivedMessages Message[] @relation("ReceivedMessages")
  
  // Conversation relations
  conversations1 Conversation[] @relation("Participant1")
  conversations2 Conversation[] @relation("Participant2")
  
  // Notes relations
  studentNotes   StudentNote[] @relation("StudentNotes")
  counselorNotes StudentNote[] @relation("CounselorNotes")
  
  // File uploads
  uploadedFiles Attachment[]
}

enum Role {
  STUDENT
  COUNSELOR
  CHAIRPERSON
}
```

### 2. Student Profile Model
```prisma
model Student {
  id                          String    @id @default(cuid())
  userId                      String    @unique
  studentId                   String    @unique // CMS ID like "CS-2024-001"
  department                  String
  batch                       String    // e.g., "Fall 2021"
  currentSemester             String    // e.g., "6th Semester"
  cgpa                        Float?    @default(0)
  enrollmentDate              DateTime
  address                     String?
  assignedCounselorId         String?
  emergencyContactName        String?
  emergencyContactPhone       String?
  emergencyContactRelationship String?
  totalSessions               Int       @default(0)
  lastSessionDate             DateTime?

  user             User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedCounselor User?     @relation("AssignedStudents", fields: [assignedCounselorId], references: [id])
  notes            StudentNote[]
}
```

### 3. Counselor Profile Model
```prisma
model Counselor {
  id                    String   @id @default(cuid())
  userId                String   @unique
  employeeId            String   @unique
  department            String
  specialization        String[] // JSON array
  officeLocation        String?
  officeHours           String?
  yearsOfExperience     Int?
  maxStudentsCapacity   Int      @default(40)
  currentStudentsCount  Int      @default(0)
  address               String?

  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  assignedStudents Student[] @relation("AssignedStudents")
}
```

### 4. Enhanced Appointment Model
```prisma
model Appointment {
  id          String            @id @default(cuid())
  studentId   String
  counselorId String
  date        DateTime
  time        String
  duration    Int               @default(60) // minutes
  location    String?
  status      AppointmentStatus @default(PENDING)
  type        AppointmentType
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  student   User @relation("StudentAppointments", fields: [studentId], references: [id])
  counselor User @relation("CounselorAppointments", fields: [counselorId], references: [id])
}

enum AppointmentStatus {
  SCHEDULED
  PENDING
  COMPLETED
  CANCELLED
}

enum AppointmentType {
  COUNSELING
  ACADEMIC
  CAREER
  PERSONAL
}
```

### 5. Messaging System Models
```prisma
model Conversation {
  id             String    @id @default(cuid())
  participant1Id String
  participant2Id String
  lastMessageId  String?
  unreadCount    Int       @default(0)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  participant1 User      @relation("Participant1", fields: [participant1Id], references: [id])
  participant2 User      @relation("Participant2", fields: [participant2Id], references: [id])
  messages     Message[]
  lastMessage  Message?  @relation("LastMessage", fields: [lastMessageId], references: [id])

  @@unique([participant1Id, participant2Id])
}

model Message {
  id             String    @id @default(cuid())
  conversationId String
  senderId       String
  receiverId     String
  content        String
  attachmentId   String?
  isRead         Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  conversation     Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender           User          @relation("SentMessages", fields: [senderId], references: [id])
  receiver         User          @relation("ReceivedMessages", fields: [receiverId], references: [id])
  attachment       Attachment?   @relation(fields: [attachmentId], references: [id])
  lastMessageFor   Conversation? @relation("LastMessage")
}
```

### 6. Student Notes Model
```prisma
model StudentNote {
  id          String      @id @default(cuid())
  studentId   String
  counselorId String
  category    NoteCategory
  content     String
  isPrivate   Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  student   User @relation("StudentNotes", fields: [studentId], references: [id])
  counselor User @relation("CounselorNotes", fields: [counselorId], references: [id])
}

enum NoteCategory {
  ACADEMIC
  BEHAVIORAL
  CAREER
  PERSONAL
  ATTENDANCE
  GENERAL
}
```

### 7. File Attachment Model
```prisma
model Attachment {
  id           String    @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  url          String
  uploadedById String
  createdAt    DateTime  @default(now())

  uploadedBy User      @relation(fields: [uploadedById], references: [id])
  messages   Message[]
}
```

## API Endpoints Implementation Plan

### Phase 1: Core Authentication & User Management

#### 1.1 Enhanced Authentication Routes (`/api/auth`)
- ✅ `POST /login` - Already implemented
- ✅ `GET /me` - Already implemented  
- ✅ `POST /register` - Already implemented
- ✅ `POST /logout` - Already implemented
- 🔄 Enhance existing endpoints to return proper user profile data
- ➕ `POST /forgot-password` - Password reset request
- ➕ `POST /reset-password` - Password reset with token

#### 1.2 User Management Routes (`/api/users`) - Chairperson only
- ➕ `GET /users` - Get all users with role-based filtering
- ➕ `POST /users/students` - Create new student
- ➕ `POST /users/counselors` - Create new counselor  
- ➕ `PUT /users/:id` - Update user profile
- ➕ `DELETE /users/:id` - Delete user
- ➕ `PATCH /users/:id/status` - Toggle user active status

### Phase 2: Profile Management

#### 2.1 Student Routes (`/api/students`)
- ➕ `GET /students` - Get students list (counselors/chairperson)
- ➕ `GET /students/:id` - Get student details
- ➕ `PUT /students/:id` - Update student profile
- ➕ `GET /students/assigned` - Get counselor's assigned students

#### 2.2 Counselor Routes (`/api/counselors`)
- ➕ `GET /counselors` - Get counselors list
- ➕ `GET /counselors/:id` - Get counselor details
- ➕ `PUT /counselors/:id` - Update counselor profile

### Phase 3: Core Features

#### 3.1 Appointment Routes (`/api/appointments`)
- ➕ `GET /appointments` - Get appointments with role-based filtering
- ➕ `POST /appointments` - Create new appointment
- ➕ `PUT /appointments/:id` - Update appointment (reschedule)
- ➕ `PATCH /appointments/:id/status` - Update appointment status
- ➕ `DELETE /appointments/:id` - Cancel appointment

#### 3.2 Dashboard Routes (`/api/dashboard`)
- ➕ `GET /dashboard/stats` - Get role-based dashboard statistics
- ➕ `GET /dashboard/appointments` - Get recent appointments
- ➕ `GET /dashboard/messages` - Get recent messages

### Phase 4: Interactive Features

#### 4.1 Messaging Routes (`/api/conversations`, `/api/messages`)
- ➕ `GET /conversations` - Get user's conversations
- ➕ `POST /conversations` - Start new conversation
- ➕ `GET /conversations/:id/messages` - Get conversation messages
- ➕ `POST /conversations/:id/messages` - Send message
- ➕ `PATCH /messages/:id/read` - Mark message as read

#### 4.2 Student Notes Routes (`/api/notes`)
- ➕ `GET /students/:id/notes` - Get student notes
- ➕ `POST /students/:id/notes` - Create new note
- ➕ `PUT /notes/:id` - Update note
- ➕ `DELETE /notes/:id` - Delete note

### Phase 5: File Management & Analytics

#### 5.1 File Upload Routes (`/api/upload`)
- ➕ `POST /upload` - Upload file attachment
- ➕ `GET /files/:id` - Download file
- ➕ `DELETE /files/:id` - Delete file
- ➕ `GET /conversations/:id/files` - Get conversation files

#### 5.2 Analytics Routes (`/api/analytics`)
- ➕ `GET /analytics/appointments` - Get appointment analytics
- ➕ `GET /analytics/students` - Get student analytics

## Directory Structure Plan

```
backend/
├── prisma/
│   ├── schema.prisma          # Enhanced database schema
│   ├── migrations/            # Database migrations
│   └── seed.js               # Database seeding script
├── routes/
│   ├── authRoutes.js         # ✅ Already exists - enhance
│   ├── userRoutes.js         # ➕ User management
│   ├── studentRoutes.js      # ➕ Student profiles
│   ├── counselorRoutes.js    # ➕ Counselor profiles
│   ├── appointmentRoutes.js  # ➕ Appointment management
│   ├── messageRoutes.js      # ➕ Messaging system
│   ├── noteRoutes.js         # ➕ Student notes
│   ├── dashboardRoutes.js    # ➕ Dashboard data
│   ├── uploadRoutes.js       # ➕ File uploads
│   └── analyticsRoutes.js    # ➕ Analytics data
├── middlewares/
│   ├── authMiddleware.js     # ✅ Already exists - enhance
│   ├── roleMiddleware.js     # ➕ Role-based access control
│   ├── uploadMiddleware.js   # ➕ File upload handling
│   └── validationMiddleware.js # ➕ Request validation
├── controllers/
│   ├── authController.js     # ➕ Auth logic separation
│   ├── userController.js     # ➕ User management logic
│   ├── appointmentController.js # ➕ Appointment logic
│   ├── messageController.js  # ➕ Messaging logic
│   ├── noteController.js     # ➕ Notes logic
│   ├── dashboardController.js # ➕ Dashboard logic
│   └── analyticsController.js # ➕ Analytics logic
├── utils/
│   ├── emailService.js       # ➕ Email notifications
│   ├── fileUtils.js          # ➕ File handling utilities
│   └── dateUtils.js          # ➕ Date/time utilities
├── uploads/                  # ➕ File storage directory
├── .env                      # Environment variables
├── server.js                 # ✅ Main server file - enhance
└── package.json              # ✅ Dependencies - add new ones
```

## Implementation Strategy

### Phase 1: Database & Authentication (Week 1)
1. **Update Prisma Schema**
   - Expand User model with required fields
   - Add Student, Counselor, Appointment models
   - Create and run migrations

2. **Enhance Authentication**
   - Update existing auth routes to return complete user profiles
   - Add password reset functionality
   - Improve error handling

3. **Add Role-based Middleware**
   - Create role checking middleware
   - Implement proper authorization

### Phase 2: Core User Management (Week 1-2)
1. **User Management Routes**
   - CRUD operations for students and counselors
   - Role-based access control
   - Profile management

2. **Dashboard Statistics**
   - Calculate real-time stats from database
   - Role-specific dashboard data
   - Recent activities

### Phase 3: Appointments & Messaging (Week 2-3)
1. **Appointment System**
   - Full CRUD operations
   - Status management
   - Role-based filtering

2. **Messaging System**
   - Conversation management
   - Real-time message handling
   - Read status tracking

### Phase 4: Notes & File Management (Week 3-4)
1. **Student Notes**
   - CRUD operations with privacy controls
   - Category-based organization
   - Counselor access management

2. **File Upload System**
   - Secure file upload/download
   - File type validation
   - Storage management

### Phase 5: Analytics & Optimization (Week 4)
1. **Analytics Endpoints**
   - Appointment analytics
   - Student engagement metrics
   - Performance statistics

2. **Performance Optimization**
   - Database query optimization
   - Caching strategies
   - Error handling improvements

## Key Technical Decisions

### 1. Database Design
- **Prisma ORM**: Continue using Prisma for type safety and migrations
- **PostgreSQL**: Maintain current database choice
- **Cascading Deletes**: Implement proper foreign key relationships
- **Indexes**: Add indexes for frequently queried fields

### 2. Authentication & Authorization
- **JWT Tokens**: Continue with current JWT implementation
- **Role-based Access**: Implement middleware for role checking
- **Token Refresh**: Consider implementing refresh tokens for better security

### 3. File Management
- **Local Storage**: Start with local file storage for simplicity
- **File Validation**: Implement proper file type and size validation
- **Security**: Ensure uploaded files are properly sanitized

### 4. API Design
- **RESTful Endpoints**: Follow REST conventions
- **Consistent Response Format**: Standardize API responses
- **Error Handling**: Implement comprehensive error handling
- **Validation**: Add request validation middleware

### 5. Performance Considerations
- **Pagination**: Implement pagination for large datasets
- **Query Optimization**: Use Prisma's query optimization features
- **Caching**: Consider simple caching for frequently accessed data

## Security Considerations

### 1. Authentication Security
- Password hashing with bcrypt (already implemented)
- JWT token expiration and validation
- Secure password reset flow

### 2. Authorization Security
- Role-based access control
- Resource ownership validation
- API endpoint protection

### 3. Data Security
- Input validation and sanitization
- SQL injection prevention (Prisma handles this)
- File upload security

### 4. General Security
- CORS configuration (already implemented)
- Rate limiting (consider for production)
- Environment variable protection


## Deployment Considerations

### 1. Environment Setup
- Development, staging, and production environments
- Environment-specific database configurations
- Secure environment variable management

### 2. Database Management
- Migration strategy for production
- Backup and recovery procedures
- Performance monitoring

### 3. File Storage
- Local storage for development
- Consider cloud storage for production
- Backup strategy for uploaded files

## Success Criteria

### 1. Functional Requirements
- ✅ All frontend API calls successfully connect to backend
- ✅ User authentication and authorization working
- ✅ Role-based access control implemented
- ✅ Real-time dashboard statistics
- ✅ Complete appointment management system
- ✅ Functional messaging system
- ✅ Student notes management
- ✅ File upload/download system
- ✅ Analytics data generation

### 2. Technical Requirements
- ✅ Database schema matches frontend requirements
- ✅ API responses match frontend service expectations
- ✅ Proper error handling and validation
- ✅ Security best practices implemented
- ✅ Performance acceptable for expected load

### 3. Quality Requirements
- ✅ Code is maintainable and well-organized
- ✅ Database relationships are properly defined
- ✅ API documentation is clear and complete
- ✅ Error messages are user-friendly
- ✅ System is stable and reliable

## Timeline Summary

- **Week 1**: Database schema, enhanced authentication, user management
- **Week 2**: Appointments system, dashboard statistics
- **Week 3**: Messaging system, student notes
- **Week 4**: File management, analytics, testing and optimization

This plan provides a clear roadmap for implementing a robust yet simple backend that meets all frontend requirements while maintaining code quality and security standards.