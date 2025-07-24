import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService } from '@/services/notifications.service';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { CheckCheck, Loader2, RefreshCw } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const { markAllAsRead } = useNotifications();

  // Query for all notifications
  const {
    data: allNotifications,
    isLoading: allLoading,
    refetch: refetchAll,
  } = useQuery({
    queryKey: ['notifications', 'all', page],
    queryFn: () => notificationService.getAllNotifications({ page, limit: 20 }),
    staleTime: 0,
  });

  // Query for unread notifications
  const {
    data: unreadNotifications,
    isLoading: unreadLoading,
    refetch: refetchUnread,
  } = useQuery({
    queryKey: ['notifications', 'unread', page],
    queryFn: () => notificationService.getNotifications({ page, limit: 20, unreadOnly: true }),
    enabled: activeTab === 'unread',
    staleTime: 0,
  });

  const currentData = activeTab === 'all' ? allNotifications : unreadNotifications;
  const isLoading = activeTab === 'all' ? allLoading : unreadLoading;
  const notifications = currentData?.data || [];
  const pagination = currentData?.pagination;

  const handleRefresh = () => {
    if (activeTab === 'all') {
      refetchAll();
    } else {
      refetchUnread();
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    refetchAll();
    refetchUnread();
  };

  const handleTabChange = (value) => {
    setActiveTab(value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread Only</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-0">
          <NotificationsList
            notifications={notifications}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        <TabsContent value="unread" className="space-y-0">
          <NotificationsList
            notifications={notifications}
            isLoading={isLoading}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationsList({ notifications, isLoading, pagination, onPageChange }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading notifications...</span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📭</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p className="text-gray-500">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <div className="bg-white rounded-lg border divide-y">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            showActions={true}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} notifications
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}