# Frontend Migration Task List

## Phase 1: Service Layer Setup & Foundation

### 1.1 API Service Layer Setup

- [ ] **Create service layer structure**
  - [ ] Create `src/services/` directory
│   ├── auth.service.js         // Authentication services
│   ├── users.service.js        // User management services
│   ├── appointments.service.js // Appointment services
│   ├── messages.service.js     // Messaging services
│   ├── notes.service.js        // Student notes services
│   ├── dashboard.service.js    // Dashboard/analytics services
│   ├── upload.service.js       // File upload services (single file)
│   ├── bus.service.js          // Bus management API calls
│   ├── schedule.service.js     // Schedule management API calls
│   ├── booking.service.js      // Booking management API calls
│   ├── search.service.js       // Search functionality API calls
│   └── analytics.service.js    // Analytics API calls


### 1.2 Authentication Services
- [ ] **Create auth.service.js**
  - [ ] Implement login service
  - [ ] Implement logout service
  - [ ] Implement getCurrentUser service
  - [ ] Implement forgotPassword service
  - [ ] Implement resetPassword service
  - [ ] Add proper error handling and response formatting

- [ ] **Update AuthContext**
  - [ ] Replace mock API calls with real services
  - [ ] Implement proper token refresh logic
  - [ ] Add better error state management
  - [ ] Update loading states

### 1.3 React Query Direct Usage Setup
- [ ] **Set up React Query patterns**
  - [ ] Create query key constants
  - [ ] Set up basic error handling patterns
  - [ ] Create simple loading state patterns
  - [ ] Set up mutation success/error patterns

## Phase 2: Core Features Migration

### 2.1 Dashboard Services & Components
- [ ] **Create dashboard.service.js**
  - [ ] Implement getDashboardStats service
  - [ ] Implement getRecentAppointments service
  - [ ] Implement getRecentMessages service
  - [ ] Add role-based data filtering

- [ ] **Update Dashboard Components**
  - [ ] Replace mock data in StudentDashboard with useQuery calls
  - [ ] Replace mock data in CounselorDashboard with useQuery calls
  - [ ] Replace mock data in ChairpersonDashboard with useQuery calls
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages

### 2.2 User Management Services
- [ ] **Create users.service.js**
  - [ ] Implement getUsers service (with filters)
  - [ ] Implement createStudent service
  - [ ] Implement createCounselor service
  - [ ] Implement updateUser service
  - [ ] Implement deleteUser service
  - [ ] Implement toggleUserStatus service

- [ ] **Update UserManagementPage**
  - [ ] Replace mock data with useQuery calls
  - [ ] Implement real CRUD operations with useMutation
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages
  - [ ] Refetch data after successful mutations

### 2.3 Student & Counselor Profile Services
- [ ] **Create profile services**
  - [ ] Implement getStudentProfile service
  - [ ] Implement getCounselorProfile service
  - [ ] Implement updateProfile service
  - [ ] Implement getStudentsList service
  - [ ] Implement getCounselorsList service

- [ ] **Update Profile Components**
  - [ ] Replace mock data in ProfilePage with useQuery calls
  - [ ] Replace mock data in StudentsPage with useQuery calls
  - [ ] Add real profile update functionality with useMutation
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages

## Phase 3: Interactive Features Migration

### 3.1 Appointment Management
- [ ] **Create appointments.service.js**
  - [ ] Implement getAppointments service (with filters)
  - [ ] Implement createAppointment service
  - [ ] Implement updateAppointment service
  - [ ] Implement cancelAppointment service
  - [ ] Implement updateAppointmentStatus service

- [ ] **Update AppointmentsPage**
  - [ ] Replace mock appointments data with useQuery calls
  - [ ] Implement real booking functionality with useMutation
  - [ ] Add appointment filtering and search
  - [ ] Implement status updates with useMutation
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages
  - [ ] Refetch data after successful mutations

### 3.2 Messaging System
- [ ] **Create messages.service.js**
  - [ ] Implement getConversations service
  - [ ] Implement getMessages service
  - [ ] Implement sendMessage service
  - [ ] Implement startConversation service
  - [ ] Implement markAsRead service

- [ ] **Update MessagesPage**
  - [ ] Replace mock conversations data with useQuery calls
  - [ ] Implement real messaging functionality with useMutation
  - [ ] Add real-time message updates (polling with refetch)
  - [ ] Implement conversation search
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages

### 3.3 Student Notes System
- [ ] **Create notes.service.js**
  - [ ] Implement getStudentNotes service
  - [ ] Implement createNote service
  - [ ] Implement updateNote service
  - [ ] Implement deleteNote service

- [ ] **Update StudentNotesPage**
  - [ ] Replace mock notes data with useQuery calls
  - [ ] Implement real CRUD operations with useMutation
  - [ ] Add notes filtering and search
  - [ ] Implement privacy settings
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages
  - [ ] Refetch data after successful mutations

### 3.4 Single File Upload System
- [ ] **Create upload.service.js**
  - [ ] Implement uploadFile service (single file only)
  - [ ] Implement downloadFile service
  - [ ] Implement deleteFile service
  - [ ] Add file validation utilities

- [ ] **Update File Upload Components**
  - [ ] Implement real single file upload in messages with useMutation
  - [ ] Add file preview functionality
  - [ ] Implement file download
  - [ ] Add simple upload progress indicators
  - [ ] Add try/catch error handling with toast messages

## Phase 4: Analytics & Optimization

### 4.1 Analytics Services
- [ ] **Create analytics services**
  - [ ] Implement getAppointmentAnalytics service
  - [ ] Implement getStudentAnalytics service
  - [ ] Implement getCounselorAnalytics service

- [ ] **Update AnalyticsPage**
  - [ ] Replace mock analytics data with useQuery calls
  - [ ] Implement real charts and graphs
  - [ ] Add date range filtering
  - [ ] Add simple loading spinners using isLoading
  - [ ] Add try/catch error handling with toast messages

### 4.2 Simple Performance Optimization
- [ ] **Basic React Query Optimization**
  - [ ] Implement simple cache invalidation
  - [ ] Add basic background refetching
  - [ ] Set up simple query deduplication

- [ ] **Simple Loading State Improvements**
  - [ ] Add basic loading spinners
  - [ ] Add loading indicators for mutations
  - [ ] Keep loading states simple and consistent

## Final Checklist

### Pre-Production
- [ ] All mock data removed
- [ ] All API endpoints integrated
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Authentication working
- [ ] Role-based access control working
- [ ] File upload/download working
- [ ] Real-time features working (polling)

### Production Ready
- [ ] Basic performance optimized
- [ ] Simple error handling implemented
- [ ] Security measures in place
- [ ] Environment variables set

## Notes
- Each task should be completed with simple try/catch error handling
- All components should have simple loading spinners using isLoading
- Use useQuery and useMutation directly in components (no custom hooks)
- Maintain consistent code style and patterns
- Keep the existing UI/UX design intact
- Use simple React Query caching strategies
- Single file upload only
- No optimistic updates needed