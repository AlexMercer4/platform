import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MessageCircle, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ConversationList from "@/components/messages/ConversationList";
import ChatWindow from "@/components/messages/ChatWindow";
import ResourcesPanel from "@/components/messages/ResourcesPanel";
import { useAuth } from "@/contexts/AuthContext";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const currentUserId = "1"; // Mock current user ID
  const { user } = useAuth();
  const userRole = user?.role;
  const [activeTab, setActiveTab] = useState("messages");

  // Mock users data
  const users = [
    {
      id: "1",
      name: "Ahmad Ali",
      email: "ahmad.ali@student.edu",
      role: "student",
      isOnline: true,
    },
    {
      id: "2",
      name: "Dr. Sarah Ahmed",
      email: "sarah@university.edu",
      role: "counselor",
      isOnline: true,
    },
    {
      id: "3",
      name: "Prof. Ahmad Hassan",
      email: "ahmad@university.edu",
      role: "counselor",
      isOnline: false,
    },
    {
      id: "4",
      name: "Dr. Fatima Sheikh",
      email: "fatima@university.edu",
      role: "counselor",
      isOnline: true,
    },
  ];

  // Mock shared resources data
  const [sharedResources] = useState([
    {
      id: "1",
      name: "Academic_Planning_Guide_2024.pdf",
      size: "2.1 MB",
      type: "application/pdf",
      url: "/files/academic-planning-guide.pdf",
      uploadedAt: "2024-06-20T15:02:00Z",
      uploadedBy: "Dr. Sarah Ahmed",
      sharedWith: ["Ahmad Ali"],
      description: "Comprehensive guide for academic planning and course selection",
    },
    {
      id: "2",
      name: "Career_Opportunities_CS_2024.docx",
      size: "1.8 MB",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      url: "/files/career-opportunities-cs.docx",
      uploadedAt: "2024-06-18T14:30:00Z",
      uploadedBy: "Prof. Ahmad Hassan",
    queryFn: dashboardService.getDashboardStats,
    enabled: !!user,
  });

  // Mock messages data
  const [messages] = useState([
    {
      id: "1",
      senderId: "2",
      receiverId: "1",
      content:
        "Hi Ahmad! I hope you're doing well. Just a reminder about our meeting tomorrow at 10 AM.",
      timestamp: "2024-06-20T14:30:00Z",
      isRead: true,
    },
    {
      id: "2",
      senderId: "1",
      receiverId: "2",
      content:
        "Hello Dr. Ahmed! Yes, I'll be there. Should I bring anything specific?",
      timestamp: "2024-06-20T14:45:00Z",
      isRead: true,
    },
    {
      id: "3",
      senderId: "2",
      receiverId: "1",
      content:
        "Please bring your academic transcript and any questions about your course selection for next semester.",
      timestamp: "2024-06-20T15:00:00Z",
      isRead: true,
    },
    {
      id: "4",
      senderId: "2",
      receiverId: "1",
      content: "Here's the academic planning guide I mentioned:",
      timestamp: "2024-06-20T15:02:00Z",
      isRead: true,
      attachment: mockAttachment,
    },
    {
      id: "5",
      senderId: "1",
      receiverId: "2",
      content: "Perfect! I have both ready. See you tomorrow!",
      timestamp: "2024-06-20T15:05:00Z",
      isRead: true,
    },
  ]);

  // Mock conversations data
  const [conversations, setConversations] = useState([
    {
      id: "1",
      participants: [users[0], users[1]], // Ahmad Ali & Dr. Sarah Ahmed
      lastMessage: messages[4],
      unreadCount: 0,
      updatedAt: "2024-06-20T15:05:00Z",
    },
    {
      id: "2",
      participants: [users[0], users[2]], // Ahmad Ali & Prof. Ahmad Hassan
      lastMessage: {
        id: "6",
        senderId: "3",
        receiverId: "1",
        content:
          "I have approved your course selection. Check the resources section for additional materials.",
        timestamp: "2024-06-19T10:00:00Z",
        isRead: false,
      },
      unreadCount: 1,
      updatedAt: "2024-06-19T10:00:00Z",
    },
    {
      id: "3",
      participants: [users[0], users[3]], // Ahmad Ali & Dr. Fatima Sheikh
      lastMessage: {
        id: "7",
        senderId: "4",
        receiverId: "1",
        content:
          "Thank you for the session today. Here are the action items we discussed...",
        timestamp: "2024-06-17T16:30:00Z",
        isRead: false,
      },
      unreadCount: 1,
      updatedAt: "2024-06-17T16:30:00Z",
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState("1");

  // Check for userId in URL params and start conversation if needed
  useEffect(() => {
    const userId = searchParams.get("userId");
    if (userId) {
      handleStartConversation(userId);
    }
  }, [searchParams]);

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const conversationMessages = activeConversationId
    ? messages.filter(
        (m) =>
          (m.senderId === currentUserId &&
            m.receiverId ===
              activeConversation?.participants.find(
                (p) => p.id !== currentUserId
              )?.id) ||
          (m.receiverId === currentUserId &&
            m.senderId ===
              activeConversation?.participants.find(
                (p) => p.id !== currentUserId
              )?.id)
      )
    : [];

  const handleSendMessage = (content, file) => {
    if (!activeConversationId) return;

    // In a real app, this would send the message to the server
    console.log("Sending message:", {
      content,
      file,
      conversationId: activeConversationId,
    });

    // Mock success feedback
    if (file) {
      console.log("File attached:", file.name);
    }
  };

  const handleStartConversation = async (userId) => {
    try {
      // Find the user to start conversation with
      const targetUser = [...users].find((u) => u.id === userId);
      if (!targetUser) {
        toast.error("User not found");
        return;
      }

      // Check if conversation already exists
      const existingConversation = conversations.find((conv) =>
        conv.participants.some((p) => p.id === userId)
      );

      if (existingConversation) {
        setActiveConversationId(existingConversation.id);
        toast.info(`Opened conversation with ${targetUser.name}`);
        return;
      }

      // Create new conversation
      const newConversation = {
        id: Date.now().toString(),
        participants: [users.find((u) => u.id === currentUserId), targetUser],
        lastMessage: {
          id: Date.now().toString(),
          senderId: currentUserId,
          receiverId: userId,
          content: "Conversation started",
          timestamp: new Date().toISOString(),
          isRead: false,
        },
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => [newConversation, ...prev]);
      setActiveConversationId(newConversation.id);
      toast.success(`Started conversation with ${targetUser.name}`);
    } catch (error) {
      toast.error("Failed to start conversation");
      throw error;
    }
  };

  // Check if user can access messaging
  if (userRole === "chairperson") {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  // Fetch recent appointments
  const { data: recentAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['dashboard', 'appointments', user?.id],
    queryFn: () => dashboardService.getRecentAppointments(2),
    enabled: !!user,
  });

  // Fetch recent messages
  const { data: recentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['dashboard', 'messages', user?.id],
    queryFn: () => dashboardService.getRecentMessages(2),
    enabled: !!user,
  });

  // Create stats data from API response
  const statsData = dashboardStats ? [
    {
      title: "Upcoming Appointments",
      value: dashboardStats.upcomingAppointments?.toString() || "0",
      subtitle: "This week",
      icon: Calendar,
      borderColor: "border-l-blue-500",
      iconBgColor: "bg-orange-500",
    },
    {
      title: "Unread Messages",
      value: dashboardStats.unreadMessages?.toString() || "0",
      subtitle: "From counselors",
      icon: MessageCircle,
      borderColor: "border-l-green-500",
      iconBgColor: "bg-yellow-500",
    },
    {
      title: "Resources Available",
      value: dashboardStats.resourcesAvailable?.toString() || "0",
      subtitle: "New this month",
      icon: BookOpen,
      borderColor: "border-l-purple-500",
      iconBgColor: "bg-yellow-600",
    },
    {
      title: "Session Hours",
      value: dashboardStats.sessionHours?.toString() || "0",
      subtitle: "This semester",
      icon: Clock,
      borderColor: "border-l-red-500",
      iconBgColor: "bg-orange-600",
    },
  ] : [];

  const isLoading = statsLoading || appointmentsLoading || messagesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0056b3]"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Messages & Resources
          </h1>
          <p className="text-gray-600 mt-2">
            Communicate with your{" "}
            {userRole === "student" ? "counselors" : "students"} and share
            resources in real-time.
          </p>
        </div>

        {/* Messages Interface */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100vh-200px)] flex">
          {/* Conversation List */}
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onConversationSelect={setActiveConversationId}
            currentUserId={currentUserId}
            userRole={userRole}
            onStartConversation={handleStartConversation}
          />

          {/* Chat Window */}
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={conversationMessages}
              currentUserId={currentUserId}
              onSendMessage={handleSendMessage}
            />
          ) : (
              {recentAppointments?.map((appointment, index) => (
              <div className="text-center">
                <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a conversation
              {recentMessages?.map((message, index) => (
                <p className="text-gray-500">
                  Choose a conversation from the list to start messaging.
                </p>
              )) || (
                <p className="text-gray-500 text-center py-4">
                  No upcoming appointments
                </p>
              )) || (
                <p className="text-gray-500 text-center py-4">
                  No recent messages
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
