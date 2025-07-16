# Frontend Migration Plan: From Mock Data to Express.js Backend

## Overview
This plan outlines the migration of the counseling platform frontend from using mock data to connecting with an Express.js backend API. The frontend will use React Query for data fetching and state management.

## Current Frontend Analysis

### Technology Stack
- **Frontend Framework**: React 18 with Vite
- **Routing**: React Router DOM v7
- **State Management**: React Query (TanStack Query) v5 - Already configured
- **HTTP Client**: Axios - Already configured with interceptors
- **UI Components**: Radix UI + Tailwind CSS
- **Form Handling**: React Hook Form + Zod validation

### Current Architecture
- **API Layer**: Basic axios instance in `src/lib/axiosInstance.js`
- **Auth Context**: `src/contexts/AuthContext.jsx` with token-based auth
- **Pages**: Role-based dashboards and feature pages
- **Components**: Reusable UI components with mock data

## Database Schema Requirements

Based on the mock data analysis, the following entities are needed:

### 1. Users Table
```sql
- id (Primary Key)
- name (String)
- email (String, Unique)
- password (String, Hashed)
- phone (String, Optional)
- role (Enum: 'student', 'counselor', 'chairperson')
- isActive (Boolean, Default: true)
- createdAt (DateTime)
- updatedAt (DateTime)
- lastLogin (DateTime, Optional)
```

### 2. Students Table (Extends Users)
```sql
- id (Primary Key, Foreign Key to Users)
- studentId (String, Unique) // CMS ID like "CS-2024-001"  
- department (String)
- batch (String) // e.g., "Fall 2021", "Spring 2022"
- currentSemester (String) // e.g., "6th Semester"
- cgpa (Decimal, Optional, Default: 0)
- enrollmentDate (Date)
- address (Text, Optional)
- assignedCounselorId (Foreign Key to Users, Optional)
- emergencyContactName (String, Optional)
- emergencyContactPhone (String, Optional)
- emergencyContactRelationship (String, Optional)
- totalSessions (Integer, Default: 0) // Track total counseling sessions
- lastSessionDate (Date, Optional) // Last counseling session date
```

### 3. Counselors Table (Extends Users)
```sql
- id (Primary Key, Foreign Key to Users)
- employeeId (String, Unique)
- department (String)
- specialization (JSON Array) // ["Academic Counseling", "Career Guidance"]
- officeLocation (String, Optional)
- officeHours (String, Optional)
- yearsOfExperience (Integer, Optional)
- maxStudentsCapacity (Integer, Default: 40)
- currentStudentsCount (Integer, Default: 0)
- address (Text, Optional)
```

### 4. Appointments Table
```sql
- id (Primary Key)
- studentId (Foreign Key to Users)
- counselorId (Foreign Key to Users)
- date (Date)
- time (Time)
- duration (Integer, Default: 60) // Duration in minutes for session hours calculation
- location (String, Optional)
- status (Enum: 'scheduled', 'pending', 'completed', 'cancelled')
- type (Enum: 'counseling', 'academic', 'career', 'personal')
- notes (Text, Optional)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### 5. Messages Table
```sql
- id (Primary Key)
- senderId (Foreign Key to Users)
- receiverId (Foreign Key to Users)
- content (Text)
- attachmentId (Foreign Key to Attachments, Optional)
- isRead (Boolean, Default: false)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### 6. Conversations Table
```sql
- id (Primary Key)
- participant1Id (Foreign Key to Users)
- participant2Id (Foreign Key to Users)
- lastMessageId (Foreign Key to Messages, Optional)
- unreadCount (Integer, Default: 0)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### 7. StudentNotes Table
```sql
- id (Primary Key)
- studentId (Foreign Key to Users)
- counselorId (Foreign Key to Users)
- category (Enum: 'academic', 'behavioral', 'career', 'personal', 'attendance', 'general')
- content (Text)
- isPrivate (Boolean, Default: true)
- createdAt (DateTime)
- updatedAt (DateTime)
```

### 8. Attachments Table
```sql
- id (Primary Key)
- filename (String)
- originalName (String)
- mimeType (String)
- size (Integer)
- url (String)
- uploadedBy (Foreign Key to Users)
- createdAt (DateTime)
```



## API Endpoints Required

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management Endpoints (Chairperson only)
- `GET /api/users` - Get all users with filters
- `POST /api/users/students` - Create new student
- `POST /api/users/counselors` - Create new counselor
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Toggle user active status

### Student Endpoints
- `GET /api/students` - Get students list (for counselors/chairperson)
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student profile
- `GET /api/students/:id/appointments` - Get student's appointments
- `GET /api/students/:id/notes` - Get student's notes

### Counselor Endpoints
- `GET /api/counselors` - Get counselors list
- `GET /api/counselors/:id` - Get counselor details
- `PUT /api/counselors/:id` - Update counselor profile
- `GET /api/counselors/:id/students` - Get counselor's assigned students

### Appointment Endpoints
- `GET /api/appointments` - Get appointments (filtered by user role)
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment
- `PATCH /api/appointments/:id/status` - Update appointment status

### Message Endpoints
- `GET /api/conversations` - Get user's conversations
- `GET /api/conversations/:id/messages` - Get conversation messages
- `POST /api/conversations/:id/messages` - Send message
- `POST /api/conversations` - Start new conversation
- `PATCH /api/messages/:id/read` - Mark message as read

### Student Notes Endpoints
- `GET /api/students/:id/notes` - Get student notes
- `POST /api/students/:id/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Dashboard/Analytics Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/analytics/appointments` - Get appointment analytics
- `GET /api/analytics/students` - Get student analytics

### File Upload Endpoints
- `POST /api/upload` - Upload file attachment (single file)
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file

## Frontend Service Layer Architecture

### API Service Structure
```
src/
├── lib/
│   └── axiosInstance.js       // Keep existing axios instance
├── services/
│   ├── auth.service.js        // Authentication services
│   ├── users.service.js       // User management services
│   ├── appointments.service.js // Appointment services
│   ├── messages.service.js    // Messaging services
│   ├── notes.service.js       // Student notes services
│   ├── dashboard.service.js   // Dashboard/analytics services
│   └── upload.service.js      // File upload services (single file)
```

### React Query Integration
- **Query Keys**: Standardized query key factory
- **Direct Usage**: Use useQuery and useMutation directly in components (no custom hooks)
- **Mutations**: Create, update, delete operations with simple refetch
- **Cache Management**: Basic React Query caching with automatic refetch
- **Error Handling**: Simple try/catch blocks with toast notifications

### Service Layer Features
- **Request/Response Interceptors**: Token management, error handling
- **Retry Logic**: Automatic retry for failed requests
- **Loading States**: Simple isLoading from React Query
- **Error Handling**: Try/catch blocks with toast notifications

## Migration Strategy

### Phase 1: Service Layer Setup
1. Create service layer structure
2. Implement authentication services
3. Set up React Query direct usage

### Phase 2: Core Features Migration
1. Authentication flow
2. Dashboard data fetching
3. User management (for chairperson)
4. Student/counselor profiles

### Phase 3: Interactive Features
1. Appointment management
2. Messaging system
3. Student notes
4. Single file uploads

### Phase 4: Analytics & Basic Optimization
1. Dashboard analytics
2. Simple caching strategies
3. Basic error handling improvements

## Key Considerations

### Security
- JWT token management
- Role-based access control
- Input validation
- File upload security

### Performance
- Simple React Query caching strategies
- Pagination for large datasets
- Responsive design maintenance

### User Experience
- Simple loading spinners with isLoading
- Toast error messages with try/catch
- Responsive design maintenance

### Maintainability
- Consistent API patterns
- Simple error handling with try/catch

## Dashboard Statistics Calculation

### Student Dashboard Stats:
- **"Upcoming Appointments"** → Count from Appointments table where studentId=current_user AND status IN ('scheduled', 'pending')
- **"Unread Messages"** → Count from Messages table where receiverId=current_user AND isRead=false
- **"Session Hours"** → Sum duration from Appointments table where studentId=current_user AND status='completed' (calculated dynamically)

### Counselor Dashboard Stats:
- **"Today's Appointments"** → Count from Appointments table where counselorId=current_user AND date=today
- **"Active Students"** → Count from Students table where assignedCounselorId=current_user AND isActive=true
- **"Unread Messages"** → Count from Messages table where receiverId=current_user AND isRead=false
- **"Session Hours"** → Sum duration from Appointments table where counselorId=current_user AND status='completed' AND date within current month (calculated dynamically)

### Chairperson Dashboard Stats:
- **"Total Students"** → Count from Students table
- **"Active Students"** → Count from Students table where isActive=true
- **"Total Counselors"** → Count from Counselors table
- **"Active Counselors"** → Count from Counselors table where isActive=true

## Success Criteria
- All mock data replaced with API calls
- Smooth user experience with proper loading states
- Robust error handling
- Role-based access control working
- Real-time messaging functionality
- File upload/download working
- Dashboard analytics displaying real data
- Session hours calculated dynamically from appointments