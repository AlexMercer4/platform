# Project Tasks - Frontend Migration to Express.js Backend

## Phase 1: Service Layer Setup

### Task 1.1: Create Service Files
- [ ] Create `src/services/auth.service.js` and move `authApi` logic from `src/api/auth.js` into it
- [ ] Create `src/services/users.service.js`
- [ ] Create `src/services/students.service.js`
- [ ] Create `src/services/counselors.service.js`
- [ ] Create `src/services/appointments.service.js`
- [ ] Create `src/services/messages.service.js`
- [ ] Create `src/services/notes.service.js`
- [ ] Create `src/services/dashboard.service.js`
- [ ] Create `src/services/upload.service.js`
- [ ] Update `src/services/index.js` to export all new services

### Task 1.2: Verify Axios Instance Configuration
- [ ] Confirm `src/lib/axiosInstance.js` correctly handles `baseURL`, `timeout`, `headers`, and interceptors for token management and error handling

### Task 1.3: Initial React Query Integration Pattern
- [ ] Demonstrate basic `useQuery` and `useMutation` usage in a simple component (e.g., `LoginPage` or `AuthContext`) to ensure setup is correct

## Phase 2: Core Features Migration

### Task 2.1: Implement Authentication Flow
- [ ] Modify `src/contexts/AuthContext.jsx` to use `authService.login`, `authService.logout`, and `authService.getCurrentUser`
- [ ] Update `src/pages/LoginPage.jsx` to call the `login` function from `AuthContext`
- [ ] Update `src/components/layout/Header.jsx` to call the `logout` function from `AuthContext`

### Task 2.2: Migrate Dashboard Data Fetching
- [ ] Modify `src/pages/StudentDashboard.jsx` to fetch data using `dashboardService.getDashboardStats` and `appointmentsService.getRecentAppointments`. Replace mock data with actual API responses
- [ ] Modify `src/pages/CounselorDashboard.jsx` to fetch data using `dashboardService.getDashboardStats` and `appointmentsService.getRecentAppointments`. Replace mock data with actual API responses
- [ ] Modify `src/pages/ChairpersonDashboard.jsx` to fetch data using `dashboardService.getDashboardStats` and `appointmentsService.getRecentAppointments`. Replace mock data with actual API responses

### Task 2.3: Implement User Management (Chairperson)
- [ ] Modify `src/pages/UserManagementPage.jsx` to fetch students and counselors using `usersService.getUsers`
- [ ] Update `src/pages/UserManagementPage.jsx` to use `usersService.deleteUser` for deleting users
- [ ] Update `src/pages/UserManagementPage.jsx` to use `usersService.toggleUserStatus` for activating/blocking users
- [ ] Modify `src/components/users/AddStudentDialog.jsx` to use `usersService.createStudent`
- [ ] Modify `src/components/users/AddCounselorDialog.jsx` to use `usersService.createCounselor`
- [ ] Modify `src/components/users/EditUserDialog.jsx` to use `usersService.updateUser`
- [ ] Modify `src/components/users/ViewUserDetailsDialog.jsx` to display data fetched from `usersService.getUsers` or specific `studentsService.getStudentById`/`counselorsService.getCounselorById`

### Task 2.4: Migrate Student and Counselor Profiles
- [ ] Modify `src/pages/ProfilePage.jsx` to fetch the user's own profile data using `authService.getCurrentUser` or specific `studentsService.getStudentById`/`counselorsService.getCounselorById` based on role
- [ ] Modify `src/components/profile/EditProfileDialog.jsx` to use `usersService.updateUser` for saving profile changes
- [ ] If `ProfilePage` can view other student profiles (as a counselor), update it to fetch that student's data using `studentsService.getStudentById`

## Phase 3: Interactive Features Migration

### Task 3.1: Implement Appointment Management
- [ ] Modify `src/pages/AppointmentsPage.jsx` to fetch appointments using `appointmentsService.getAppointments`
- [ ] Update `src/pages/AppointmentsPage.jsx` to use `appointmentsService.updateAppointmentStatus` for canceling and completing appointments
- [ ] Modify `src/components/appointments/BookAppointmentDialog.jsx` to use `appointmentsService.createAppointment` for booking new appointments
- [ ] Implement rescheduling functionality in `src/pages/AppointmentsPage.jsx` using `appointmentsService.updateAppointment`

### Task 3.2: Implement Messaging System
- [ ] Modify `src/pages/MessagesPage.jsx` to fetch conversations using `messagesService.getConversations`
- [ ] Modify `src/pages/MessagesPage.jsx` to fetch messages for the active conversation using `messagesService.getMessages`
- [ ] Update `src/components/messages/MessageInput.jsx` to use `messagesService.sendMessage`
- [ ] Update `src/components/messages/StartConversationDialog.jsx` to use `messagesService.startConversation`
- [ ] Implement marking messages as read using `messagesService.markAsRead`
- [ ] **NEW**: Modify `src/pages/MessagesPage.jsx` to separate chat interface (text only) from file resources by creating a "Resources" tab that shows shared files
- [ ] **NEW**: Create `src/components/messages/ResourcesPanel.jsx` component to display shared files with upload/download functionality
- [ ] **NEW**: Remove file attachment functionality from `src/components/messages/MessageInput.jsx` and `src/components/messages/ChatMessage.jsx`

### Task 3.3: Implement Student Notes Management
- [ ] Modify `src/pages/StudentNotesPage.jsx` to fetch student notes using `notesService.getStudentNotes`
- [ ] Update `src/pages/StudentNotesPage.jsx` to use `notesService.createNote` for adding new notes
- [ ] Update `src/pages/StudentNotesPage.jsx` to use `notesService.updateNote` for editing notes
- [ ] Update `src/pages/StudentNotesPage.jsx` to use `notesService.deleteNote` for deleting notes

### Task 3.4: Integrate File Uploads (Resources Tab)
- [ ] Create file upload functionality in the Resources tab using `uploadService.uploadFile`
- [ ] Implement file download functionality using `uploadService.downloadFile`
- [ ] Implement file deletion functionality using `uploadService.deleteFile`

## Phase 4: Analytics & Basic Optimization

### Task 4.1: Migrate Analytics Data
- [ ] Modify `src/pages/AnalyticsPage.jsx` to fetch data using `analyticsService.getAppointmentAnalytics` and `analyticsService.getStudentAnalytics`. Replace mock data with actual API responses

### Task 4.2: Enhance Error Handling and Loading States
- [ ] Review all components and ensure `isLoading` states from React Query are consistently used to provide visual feedback
- [ ] Ensure all API calls are wrapped in `try/catch` blocks and use `toast.error` for user-friendly error messages

## Progress Tracking

### Completed Tasks
- [ ] None yet

### In Progress
- [ ] None yet

### Blocked/Issues
- [ ] None yet

## Notes
- Remember to test each phase thoroughly before moving to the next
- Keep the existing UI/UX design while migrating to real API calls
- Maintain role-based access control throughout the migration
- File attachments in messages will be moved to a separate Resources tab for better organization