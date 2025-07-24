// Request validation middleware

// Generic validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Phone validation (optional)
export const validatePhone = (phone) => {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

// Student ID validation
export const validateStudentId = (studentId) => {
  if (!studentId) return false;
  // Format: CS-2024-001, EE-2023-045, etc.
  const studentIdRegex = /^[A-Z]{2,4}-\d{4}-\d{3}$/;
  return studentIdRegex.test(studentId);
};

// Employee ID validation
export const validateEmployeeId = (employeeId) => {
  if (!employeeId) return false;
  // Format: EMP-001, EMP-123, etc.
  const employeeIdRegex = /^EMP-\d{3,6}$/;
  return employeeIdRegex.test(employeeId);
};

// Common validation schemas
export const authValidation = {
  register: (req, res, next) => {
    const { name, email, password, role, phone } = req.body;
    const errors = [];

    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Name must be at least 2 characters long' });
    }

    if (!email || !validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!password || !validatePassword(password)) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    if (!role || !['STUDENT', 'COUNSELOR', 'CHAIRPERSON'].includes(role.toUpperCase())) {
      errors.push({ field: 'role', message: 'Valid role is required (STUDENT, COUNSELOR, or CHAIRPERSON)' });
    }

    if (phone && !validatePhone(phone)) {
      errors.push({ field: 'phone', message: 'Invalid phone number format' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  },

  login: (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email || !validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (!password) {
      errors.push({ field: 'password', message: 'Password is required' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  },

  forgotPassword: (req, res, next) => {
    const { email } = req.body;
    const errors = [];

    if (!email || !validateEmail(email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  },

  resetPassword: (req, res, next) => {
    const { token, password } = req.body;
    const errors = [];

    if (!token) {
      errors.push({ field: 'token', message: 'Reset token is required' });
    }

    if (!password || !validatePassword(password)) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  }
};

// Appointment validation
export const appointmentValidation = {
  create: (req, res, next) => {
    const { studentId, counselorId, date, time, type } = req.body;
    const errors = [];

    if (!studentId) {
      errors.push({ field: 'studentId', message: 'Student ID is required' });
    }

    if (!counselorId) {
      errors.push({ field: 'counselorId', message: 'Counselor ID is required' });
    }

    if (!date) {
      errors.push({ field: 'date', message: 'Date is required' });
    } else {
      const appointmentDate = new Date(date);
      if (appointmentDate < new Date()) {
        errors.push({ field: 'date', message: 'Appointment date cannot be in the past' });
      }
    }

    if (!time) {
      errors.push({ field: 'time', message: 'Time is required' });
    }

    if (!type || !['COUNSELING', 'ACADEMIC', 'CAREER', 'PERSONAL'].includes(type.toUpperCase())) {
      errors.push({ field: 'type', message: 'Valid appointment type is required' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  }
};

// Student note validation
export const noteValidation = {
  create: (req, res, next) => {
    const { content, category } = req.body;
    const errors = [];

    if (!content || content.trim().length < 10) {
      errors.push({ field: 'content', message: 'Note content must be at least 10 characters long' });
    }

    if (!category || !['ACADEMIC', 'BEHAVIORAL', 'CAREER', 'PERSONAL', 'ATTENDANCE', 'GENERAL'].includes(category.toUpperCase())) {
      errors.push({ field: 'category', message: 'Valid note category is required' });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    next();
  }
};