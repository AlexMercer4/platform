import { Check, CheckCheck, FileText, Paperclip, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ChatMessage({ message, isOwn, sender }) {
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  const formatFullTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    }) + " at " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
  
  const formatDate = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if message is from today
    if (messageDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    
    // Check if message is from yesterday
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Otherwise return the date
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: messageDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined
    });
  };
  
  const toggleTimestamp = () => {
    setShowFullTimestamp(!showFullTimestamp);
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 md:mb-4 group`}>
      <div className={`max-w-[75%] md:max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>


        <div
          className={`rounded-lg px-3 py-2 md:px-4 md:py-2 ${
            isOwn ? "bg-[#0056b3] text-white" : "bg-gray-100 text-gray-900"
          }`}
        >
          {message.content && (
            <p className="text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
          
          {message.attachment && (
            <div className={`mt-2 p-2 rounded-md flex items-center ${
              isOwn ? "bg-blue-700" : "bg-gray-200"
            }`}>
              <FileText className={`h-5 w-5 mr-2 ${isOwn ? "text-white" : "text-gray-600"}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium truncate ${isOwn ? "text-white" : "text-gray-900"}`}>
                  {message.attachment.originalName || "Attachment"}
                </p>
                <p className={`text-xs ${isOwn ? "text-blue-200" : "text-gray-500"}`}>
                  {(message.attachment.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                size="icon" 
                variant={isOwn ? "ghost" : "outline"} 
                className={`h-7 w-7 ${isOwn ? "text-white hover:bg-blue-800" : ""}`}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div
          className={`flex items-center mt-1 space-x-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span 
            className="text-[10px] md:text-xs text-gray-500 cursor-pointer hover:underline"
            onClick={toggleTimestamp}
          >
            {showFullTimestamp ? formatFullTimestamp(message.createdAt) : formatTime(message.createdAt)}
          </span>
          {isOwn && (
            <div className="text-gray-400">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 text-blue-500" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
