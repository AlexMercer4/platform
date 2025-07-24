import { formatDistanceToNow } from 'date-fns';
import { Bell, Calendar, MessageCircle, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'MESSAGE':
      return <MessageCircle className="h-4 w-4 text-blue-500" />;
    case 'APPOINTMENT_CREATED':
    case 'APPOINTMENT_UPDATED':
    case 'APPOINTMENT_CANCELLED':
    case 'APPOINTMENT_REMINDER':
      return <Calendar className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'MESSAGE':
      return 'border-l-blue-500';
    case 'APPOINTMENT_CREATED':
    case 'APPOINTMENT_UPDATED':
      return 'border-l-green-500';
    case 'APPOINTMENT_CANCELLED':
      return 'border-l-red-500';
    case 'APPOINTMENT_REMINDER':
      return 'border-l-yellow-500';
    default:
      return 'border-l-gray-500';
  }
};

export default function NotificationItem({ notification, showActions = true, onClick }) {
  const { markAsRead } = useNotifications();

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    await markAsRead(notification.id);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div
      className={`p-3 border-l-4 ${getNotificationColor(notification.type)} ${
        !notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
      } cursor-pointer transition-colors`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.isRead ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
            
            {showActions && (
              <div className="flex items-center gap-1">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAsRead}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    title="Mark as read"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
                
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Unread" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}