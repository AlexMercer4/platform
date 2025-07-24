import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        // Check if token exists in localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        
        const userData = await authService.getCurrentUser();
        setUser(userData.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        // Clear invalid token
        localStorage.removeItem('authToken');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      // Store the token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      toast.success("Login successful");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

      return response;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      
      // Clear token from localStorage
      localStorage.removeItem('authToken');
      
      setUser(null);
      setIsAuthenticated(false);
      toast.success("Logout successful");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
      
    } catch (error) {
      toast.error("Logout failed");
      console.error("Logout error:", error);
      
      // Clear token even if logout request fails
      localStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateProfile = (updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};