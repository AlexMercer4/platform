import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // Base URL for all requests
  timeout: 10000, // Request timeout in milliseconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    
    // If token exists, add it to request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle different error status codes
    if (response) {
      switch (response.status) {
        case 401: // Unauthorized
          // Clear token and redirect to login if unauthorized
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          toast.error('Session expired. Please log in again.');
          break;
        
        case 403: // Forbidden
          toast.error('You do not have permission to perform this action.');
          break;
        
        case 404: // Not Found
          toast.error('Resource not found.');
          break;
        
        case 500: // Server Error
          toast.error('Server error. Please try again later.');
          break;
        
        default:
          // Handle other errors
          const errorMessage = response.data?.message || 'Something went wrong.';
          toast.error(errorMessage);
      }
    } else {
      // Network error or server not responding
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;