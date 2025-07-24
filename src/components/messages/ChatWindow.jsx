import { useState, useEffect, useRef } from "react";
import { FolderOpen, User, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChatMessage from "./ChatMessage";
import MessageInput from "./MessageInput";
import ResourcesDialog from "./ResourcesDialog";

export default function ChatWindow({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onMarkAsRead,
  isLoading,
}) {
  const [isResourcesDialogOpen, setIsResourcesDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const otherUser = conversation.otherUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Get the appropriate icon based on user role
  const getUserIcon = () => {
    if (!otherUser) return <User className="h-5 w-5 text-white" />;
    
    switch (otherUser.role) {
      case 'student':
        return <GraduationCap className="h-5 w-5 text-white" />;
      case 'counselor':
        return <Briefcase className="h-5 w-5 text-white" />;
      default:
        return <User className="h-5 w-5 text-white" />;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-[#ffbc3b] text-white p-3 md:p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="relative">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
              {getUserIcon()}
            </div>
          </div>

          <div className="overflow-hidden">
            <div className="flex items-center space-x-2">
              <h3 className="font-medium text-sm md:text-base truncate max-w-[120px] md:max-w-full">
                {otherUser?.name || "Unknown User"}
              </h3>
              {otherUser?.role && (
                <Badge className={`text-[10px] md:text-xs ${
                  otherUser.role === 'student' ? 'bg-blue-600' : 
                  otherUser.role === 'counselor' ? 'bg-green-600' : 'bg-gray-600'
                }`}>
                  {otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1)}
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-white/80 truncate max-w-[150px] md:max-w-full">
              {otherUser?.role === 'student' && otherUser.studentId && `ID: ${otherUser.studentId}`}
              {otherUser?.role === 'counselor' && otherUser.department && otherUser.department}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 px-2 md:px-3"
            onClick={() => setIsResourcesDialogOpen(true)}
          >
            <FolderOpen className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Resources</span>
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0056b3] mx-auto mb-4"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Group messages by date */}
            {messages.reduce((result, message, index, array) => {
              // Format the current message date
              const messageDate = new Date(message.createdAt).toDateString();
              
              // Check if this is the first message or if the date is different from the previous message
              if (index === 0 || messageDate !== new Date(array[index - 1].createdAt).toDateString()) {
                // Add a date separator
                result.push(
                  <div key={`date-${message.id}`} className="flex justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {new Date(message.createdAt).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: new Date(message.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </div>
                  </div>
                );
              }
              
              // Add the message
              result.push(
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.sender.id === currentUserId}
                  sender={message.sender}
                />
              );
              
              return result;
            }, [])}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <MessageInput onSendMessage={onSendMessage} />
      
      {/* Resources Dialog */}
      <ResourcesDialog
        open={isResourcesDialogOpen}
        onOpenChange={setIsResourcesDialogOpen}
        conversationId={conversation.id}
        currentUserId={currentUserId}
      />
    </div>
  );
}
