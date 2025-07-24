import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notifications.service';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Query for unread count
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0, // Always consider stale for real-time updates
  });

  // Query for recent notifications (for dropdown)
  const { data: recentNotifications, refetch: refetchRecent } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.getNotifications({ limit: 10 }),
    enabled: isAuthenticated && isDropdownOpen,
    staleTime: 0,
  });

  const unreadCount = unreadCountData?.count || 0;

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      
      // Update queries
      queryClient.invalidateQueries(['notifications']);
      refetchUnreadCount();
      refetchRecent();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update queries
      queryClient.invalidateQueries(['notifications']);
      refetchUnreadCount();
      refetchRecent();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    refetchUnreadCount();
    if (isDropdownOpen) {
      refetchRecent();
    }
  };

  const value = {
    unreadCount,
    recentNotifications: recentNotifications?.data || [],
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};