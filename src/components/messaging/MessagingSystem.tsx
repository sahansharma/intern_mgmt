import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Search, MessageSquare, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { sendNewMessageNotification } from '@/services/notificationService';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read_at?: string;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
}

interface Conversation {
  profile: Profile;
  lastMessage?: Message;
  unreadCount: number;
}

interface MessagingSystemProps {
  userRole: 'supervisor' | 'intern';
  userId: string;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ userRole, userId }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchConversations();
    
    // Set up real-time message subscription
    const subscription = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMsg = payload.new as Message;
          
          // Update conversations list
          fetchConversations();
          
          // If this message is for the current conversation, add it immediately
          if (selectedConversation && 
              (newMsg.sender_id === selectedConversation.id || newMsg.receiver_id === selectedConversation.id)) {
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              if (prev.find(m => m.id === newMsg.id)) {
                return prev;
              }
              return [...prev, newMsg];
            });
            
            // Auto-scroll to bottom
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message updated:', payload);
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [userId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      // Get all profiles that the user can message
      let query = supabase.from('profiles').select('*');
      
      if (userRole === 'supervisor') {
        query = query.eq('role', 'intern');
      } else {
        query = query.eq('role', 'supervisor');
      }

      const { data: profiles, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // For each profile, get the last message and unread count
      const conversationsData = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact' })
            .eq('sender_id', profile.id)
            .eq('receiver_id', userId)
            .is('read_at', null);

          return {
            profile,
            lastMessage: lastMessage || undefined,
            unreadCount: unreadCount || 0,
          };
        })
      );

      // Sort by last message time (most recent first)
      conversationsData.sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
        return timeB - timeA;
      });

      setConversations(conversationsData);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (senderId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', senderId)
        .eq('receiver_id', userId)
        .is('read_at', null);

      // Update conversations to reflect read status
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      // Get current user profile for notification
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      const { error } = await supabase.from('messages').insert({
        content: newMessage,
        sender_id: userId,
        receiver_id: selectedConversation.id,
      });

      if (error) throw error;

      // Send notification to receiver
      if (senderProfile) {
        await sendNewMessageNotification(userId, selectedConversation.id, senderProfile.full_name);
      }

      setNewMessage('');
      // Message will be added to the list via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleWhatsAppClick = (phoneNumber?: string) => {
    if (!phoneNumber) {
      toast({
        title: "No phone number",
        description: "This user hasn't added their phone number yet",
        variant: "destructive",
      });
      return;
    }
    
    // For supervisor, use the provided number, for interns use their number
    const targetNumber = phoneNumber;
    const supervisorNumber = "+977 9766858571";
    
    // Clean phone number and format for WhatsApp
    const cleanNumber = targetNumber.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  const getWhatsAppNumber = (profile: Profile, userRole: string) => {
    if (userRole === 'supervisor') {
      // Supervisor contacting intern - use intern's number
      return profile.phone;
    } else {
      // Intern contacting supervisor - use supervisor's number
      return "+977 9766858571";
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground">
          Communicate with your {userRole === 'supervisor' ? 'interns' : 'supervisor'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px] max-h-[80vh]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversations</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-y-auto h-[calc(100%-120px)] max-h-[480px]">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.profile.id}
                    className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                      selectedConversation?.id === conversation.profile.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.profile)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(conversation.profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-medium truncate">
                            {conversation.profile.full_name}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {conversation.profile.role}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No conversations found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="lg:col-span-2 h-full">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(selectedConversation.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{selectedConversation.full_name}</CardTitle>
                      {(() => {
                        const whatsappNumber = getWhatsAppNumber(selectedConversation, userRole);
                        return whatsappNumber ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleWhatsAppClick(whatsappNumber)}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        ) : null;
                      })()}
                    </div>
                    <CardDescription className="capitalize">
                      {selectedConversation.role}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col h-[calc(100%-80px)] max-h-[480px]">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender_id === userId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.sender_id === userId
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender_id === userId
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatMessageTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessagingSystem;