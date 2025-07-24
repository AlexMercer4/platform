import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function MessageInput({ onSendMessage, disabled = false }) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    
    try {
      onSendMessage({
        content: message.trim()
      });
      
      // Clear the input
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-2 md:p-4 bg-white">
      
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            disabled={disabled || isUploading}
            className="min-h-[36px] md:min-h-[40px] max-h-32 resize-none border-gray-200 focus:border-[#0056b3] focus:ring-[#0056b3] text-sm md:text-base py-1.5 md:py-2"
            rows={1}
          />
        </div>

        <div className="flex items-center">
          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={disabled || isUploading || !message.trim()}
            size="sm"
            className="bg-[#0056b3] hover:bg-[#004494] h-8 w-8 md:h-9 md:w-9 p-0"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
