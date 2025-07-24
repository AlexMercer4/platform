import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from './NotificationItem';
import { CheckCheck, Eye } from 'lucide-react';

export default function NotificationDropdown({ children }) {
  const {
    recentNotifications,
    isDropdownOpen,
    setIsDropdownOpen,
    markAllAsRead,
  } = useNotifications();

  const hasUnreadNotifications = recentNotifications.some(n => !n.isRead);

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {hasUnreadNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800 h-auto p-1"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="mb-2">📭</div>
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  showActions={false}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {recentNotifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <Button
              asChild
              variant="ghost"
              className="w-full text-sm text-blue-600 hover:text-blue-800 justify-center"
            >
              <Link to="/notifications" onClick={() => setIsDropdownOpen(false)}>
                <Eye className="h-4 w-4 mr-2" />
                View All Notifications
              </Link>
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}