import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ConversationList from "@/components/messages/ConversationList";
import ChatWindow from "@/components/messages/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { messagesService } from "@/services/messages.service";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userRole = user?.role;
  const currentUserId = user?.id || "1";
  const [activeConversationId, setActiveConversationId] = useState(null);
  
  // State to track if we're showing the chat on mobile
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Check if we're on mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Fetch conversations using React Query
  const { 
    data: conversations = [], 
    isLoading: isLoadingConversations,
    error: conversationsError
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesService.getConversations,
    refetchInterval: 30000, // Poll every 30 seconds
    onError: (error) => {
      toast.error(`Failed to load conversations: ${error.message}`);
    }
  });

  // Fetch messages for active conversation
  const { 
    data: conversationMessages = [], 
    isLoading: isLoadingMessages,
    error: messagesError
  } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: () => activeConversationId ? messagesService.getMessages(activeConversationId) : [],
    enabled: !!activeConversationId,
    refetchInterval: activeConversationId ? 15000 : false, // Poll every 15 seconds when conversation is active
    onSuccess: (data) => {
      // Mark unread messages as read when they are loaded
      if (data && data.length > 0) {
        const unreadMessages = data.filter(
          msg => !msg.isRead && msg.sender.id !== currentUserId
        );
        
        if (unreadMessages.length > 0) {
          // Mark each unread message as read
          unreadMessages.forEach(msg => {
            markAsReadMutation.mutate(msg.id);
          });
        }
      }
    },
    onError: (error) => {
      toast.error(`Failed to load messages: ${error.message}`);
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ conversationId, content }) => 
      messagesService.sendMessage(conversationId, { content }),
    onSuccess: () => {
      // Refetch messages and conversations after sending a message
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    }
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: (participantId) => messagesService.startConversation(participantId),
    onSuccess: (data) => {
      setActiveConversationId(data.conversation.id);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success(`Started conversation successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to start conversation: ${error.message || "Unknown error"}`);
    }
  });

  // Mark message as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => messagesService.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });

  // Check for userId in URL params and start conversation if needed
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      handleStartConversation(userId);
    }
  }, [searchParams]);
  
  // Auto-select the first conversation if none is selected and conversations are loaded
  useEffect(() => {
    if (!activeConversationId && conversations.length > 0 && !isLoadingConversations) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations, isLoadingConversations]);
  
  // Effect to show chat on mobile when a conversation is selected
  useEffect(() => {
    if (isMobile && activeConversationId) {
      setShowMobileChat(true);
    }
  }, [isMobile, activeConversationId]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );

  const handleSendMessage = (messageData) => {
    if (!activeConversationId) return;

    try {
      // Add loading state or optimistic update if needed
      sendMessageMutation.mutate({ 
        conversationId: activeConversationId, 
        ...messageData
      });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };
  
  // Function to handle marking a message as read
  const handleMarkAsRead = (messageId) => {
    if (!messageId) return;
    
    markAsReadMutation.mutate(messageId);
  };

  const handleStartConversation = async (userId) => {
    try {
      // Check if conversation already exists
      const existingConversation = conversations.find((conv) =>
        conv.otherUser.id === userId
      );

      if (existingConversation) {
        setActiveConversationId(existingConversation.id);
        if (isMobile) {
          setShowMobileChat(true);
        }
        toast.info(`Opened existing conversation`);
        return;
      }

      // Start new conversation
      startConversationMutation.mutate(userId);
      if (isMobile) {
        setShowMobileChat(true);
      }
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };
  
  // Handle back button on mobile
  const handleBackToList = () => {
    setShowMobileChat(false);
  };

  // Check if user can access messaging
  if (userRole === "chairperson") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Messages Not Available
            </h2>
            <p className="text-gray-600">
              Chairpersons do not have access to direct messaging. Please use
              the reporting and analytics features instead.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header Section - Simplified on mobile */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Messages
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1 md:mt-2">
            Communicate with your{" "}
            {userRole === "student" ? "counselor" : "students"}
          </p>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] flex">
          {/* Conversation List - Hidden on mobile when chat is shown */}
          <div className={`${isMobile && showMobileChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80`}>
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onConversationSelect={(id) => {
                setActiveConversationId(id);
                if (isMobile) {
                  setShowMobileChat(true);
                }
              }}
              currentUserId={currentUserId}
              userRole={userRole}
              onStartConversation={handleStartConversation}
              isLoading={isLoadingConversations}
            />
          </div>

          {/* Right Panel - Full width on mobile when chat is shown */}
          <div className={`${isMobile && !showMobileChat ? 'hidden' : 'flex'} md:flex flex-1 flex-col`}>
            {activeConversation ? (
              <>
                {/* Mobile back button */}
                {isMobile && (
                  <div className="bg-gray-100 p-2 flex items-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleBackToList}
                      className="flex items-center text-gray-600"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Back to conversations
                    </Button>
                  </div>
                )}
                
                <ChatWindow
                  conversation={activeConversation}
                  messages={conversationMessages}
                  currentUserId={currentUserId}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                  isLoading={isLoadingMessages}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500">
                    Choose a conversation from the list to start messaging.
                  </p>
                  {/* Mobile back button when no conversation is selected */}
                  {isMobile && showMobileChat && (
                    <Button 
                      onClick={handleBackToList}
                      className="mt-4 bg-[#0056b3] hover:bg-[#004494]"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to conversations
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
