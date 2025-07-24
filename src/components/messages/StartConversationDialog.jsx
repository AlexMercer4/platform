import { useState, useEffect } from "react";
import { Search, User, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { messagesService } from "@/services/messages.service";
import { toast } from "sonner";

export default function StartConversationDialog({
  open,
  onOpenChange,
  userRole,
  onStartConversation,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Use React Query to fetch assigned users when dialog opens and filter with search
  const {
    data: searchResults = { data: [] },
    isLoading: isSearching,
    error
  } = useQuery({
    queryKey: ['messageUsers', searchQuery],
    queryFn: () => messagesService.searchUsers(searchQuery),
    enabled: open, // Always fetch when dialog is open
    staleTime: 30000, // Cache results for 30 seconds
    onError: (error) => {
      toast.error(`Failed to load users: ${error.message}`);
    }
  });

  // Get all users from the API response
  const allUsers = searchResults.data || [];
  
  // Filter users based on search query if provided
  const users = searchQuery.length > 0
    ? allUsers.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.department && user.department.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allUsers;

  const handleStartConversation = async (userId) => {
    setIsLoading(true);
    try {
      await onStartConversation(userId);
      onOpenChange(false);
      setSearchQuery("");
    } catch (error) {
      console.error("Error starting conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetDialog = () => {
    setSearchQuery("");
  };
  
  // Effect to reset search when dialog opens
  useEffect(() => {
    if (open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) resetDialog();
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-[#0056b3]" />
            <span>
              Start New Conversation with{" "}
              {userRole === "student" ? "Counselor" : "Student"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Filter ${
                userRole === "student" ? "counselors" : "students"
              }...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
          
          {/* User Count */}
          {!isSearching && users.length > 0 && (
            <div className="text-sm text-gray-500">
              {searchQuery.length > 0 
                ? `Found ${users.length} matching ${users.length === 1 ? 'user' : 'users'}`
                : userRole === "student" 
                  ? "Your assigned counselor:"
                  : `Your assigned students (${users.length}):`
              }
            </div>
          )}

          {/* Users List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {isSearching ? (
              <div className="text-center py-8 text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#0056b3]" />
                <p>Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.length > 0
                  ? "No users found matching your search"
                  : userRole === "student"
                  ? "You don't have an assigned counselor"
                  : "You don't have any assigned students"}
              </div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="bg-gray-200 p-2 rounded-full">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        {user.role === "student" && (
                          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">
                            Student ID: {user.studentId}
                          </Badge>
                        )}
                        {user.role === "counselor" && (
                          <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                            {user.department || "Counselor"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Button
                      size="sm"
                      onClick={() => handleStartConversation(user.id)}
                      disabled={isLoading}
                      className="bg-[#0056b3] hover:bg-[#004494] text-white"
                    >
                      {isLoading ? "Starting..." : "Start Chat"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
