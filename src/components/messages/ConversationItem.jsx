import { User, Briefcase, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ConversationItem({
  conversation,
  isActive,
  onClick,
  currentUserId,
}) {
  const otherUser = conversation.otherUser;

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get the appropriate icon based on user role
  const getUserIcon = () => {
    if (!otherUser) return <User className="h-5 w-5 text-gray-600" />;
    
    switch (otherUser.role) {
      case 'student':
        return <GraduationCap className="h-5 w-5 text-blue-600" />;
      case 'counselor':
        return <Briefcase className="h-5 w-5 text-green-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get additional user info based on role
  const getUserInfo = () => {
    if (!otherUser) return null;
    
    if (otherUser.role === 'student' && otherUser.studentId) {
      return (
        <span className="text-xs text-gray-500">
          ID: {otherUser.studentId}
        </span>
      );
    } else if (otherUser.role === 'counselor' && otherUser.department) {
      return (
        <span className="text-xs text-gray-500">
          {otherUser.department}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      onClick={onClick}
      className={`p-3 md:p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
        isActive ? "bg-blue-50 border-l-4 border-l-[#0056b3]" : ""
      }`}
    >
      <div className="flex items-start space-x-2 md:space-x-3">
        <div className="relative">
          <div className={`p-1.5 md:p-2 rounded-full ${
            otherUser?.role === 'student' ? 'bg-blue-100' : 
            otherUser?.role === 'counselor' ? 'bg-green-100' : 'bg-gray-200'
          }`}>
            {getUserIcon()}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5 md:mb-1">
            <div className="max-w-[60%]">
              <h3
                className={`text-xs md:text-sm font-medium truncate ${
                  conversation.unreadCount > 0 ? "text-gray-900" : "text-gray-700"
                }`}
              >
                {otherUser?.name || "Unknown User"}
              </h3>
              <div className="hidden md:block">
                {getUserInfo()}
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              {conversation.lastMessage && (
                <span className="text-[10px] md:text-xs text-gray-500">
                  {formatTime(conversation.lastMessage.createdAt)}
                </span>
              )}
              {conversation.unreadCount > 0 && (
                <Badge className="bg-[#0056b3] text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full">
                  {conversation.unreadCount}
                </Badge>
              )}
            </div>
          </div>

          <p
            className={`text-xs md:text-sm truncate ${
              conversation.unreadCount > 0
                ? "text-gray-900 font-medium"
                : "text-gray-500"
            }`}
          >
            {conversation.lastMessage ? (
              conversation.lastMessage.attachment
                ? `📎 Attachment`
                : conversation.lastMessage.content
            ) : (
              "No messages yet"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
