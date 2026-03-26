"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getChats, getChatMessages, sendMessage as serverSendMessage, createChatSession } from "@/app/actions/chat";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export type MessageType = "text" | "image";
export type SenderRole = "client" | "manager" | "engineer" | "admin" | "warehouse" | "delivery" | "guest";

export interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isInternal?: boolean;
  type?: MessageType;
}

export interface ChatSession {
  id: string; // converted to string for compatibility
  dbId: number;
  clientName: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  clientUnreadCount: number; // Not really used in DB logic yet, but kept for compatibility
  status: "active" | "closed" | "archived";
  nextCursor?: number;
  isLoadingMore?: boolean;
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  role: string;
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string, isInternal?: boolean) => Promise<void>;
  selectSession: (sessionId: string) => void;
  currentUserRole: string;
  setRole: (role: string) => void; // Deprecated/Debug
  createNewChat: () => Promise<void>;
  refreshChats: () => Promise<void>;
  loadMoreMessages: (sessionId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ 
  children, 
  initialRole = "guest",
}: { 
  children: React.ReactNode;
  initialRole?: string;
}) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState<string>(initialRole);

  // Sync role if prop changes (e.g. login)
  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  const fetchChats = useCallback(async () => {
    if (role === 'guest') return; // Guests don't fetch DB chats yet
    try {
      const dbChats = await getChats();
      
      const mappedSessions: ChatSession[] = await Promise.all(dbChats.map(async (chat) => {
        // Optimization: Fetch messages only if it's the current session and we don't have them yet
        let messages: Message[] = [];
        let nextCursor: number | undefined = undefined;

        if (currentSessionId === chat.id.toString()) {
             const { messages: dbMessages, nextCursor: dbNextCursor } = await getChatMessages(chat.id);
             messages = dbMessages.map(m => ({
                 id: m.id.toString(),
                 text: m.content,
                 sender: m.sender?.role || 'system',
                 timestamp: new Date(m.createdAt).getTime(),
                 isInternal: m.isInternal,
                 type: 'text'
             }));
             nextCursor = dbNextCursor;
        }

        return {
          id: chat.id.toString(),
          dbId: chat.id,
          clientName: chat.user.name || chat.user.email,
          messages: messages, // Will be empty unless selected
          unreadCount: chat.unreadCount || 0,
          clientUnreadCount: (role === 'user' || role === 'client') ? (chat.unreadCount || 0) : 0, 
          status: chat.status as any,
          nextCursor
        };
      }));

      setSessions(prev => {
         return mappedSessions.map(newS => {
             const oldS = prev.find(p => p.id === newS.id);
             // If this is current session, we already have new messages/cursor
             if (newS.id === currentSessionId) {
               // But if we already had more messages (pagination), we might want to merge
               // Actually for the poll, we only care about NEW messages at the bottom
               // Simplified: for now just update if it's current, but in a real app 
               // we'd check if last message ID is different.
               return newS;
             }
             return { ...newS, messages: oldS?.messages || [], nextCursor: oldS?.nextCursor };
         });
      });
      
      // If client has only one chat and no current session, select it
      if ((role === 'user' || role === 'client') && dbChats.length === 1 && !currentSessionId) {
          setCurrentSessionId(dbChats[0].id.toString());
      }

    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  }, [role, currentSessionId]);

  // Initial fetch and polling
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000); // Increased to 10s for less aggressive polling
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Load messages when session is selected
  useEffect(() => {
      if (currentSessionId && role !== 'guest') {
          const session = sessions.find(s => s.id === currentSessionId);
          // Only fetch if we don't have messages yet
          if (!session || session.messages.length === 0) {
            getChatMessages(parseInt(currentSessionId)).then(({ messages: dbMessages, nextCursor }) => {
                setSessions(prev => prev.map(s => {
                    if (s.id === currentSessionId) {
                        return {
                            ...s,
                            messages: dbMessages.map(m => ({
                                id: m.id.toString(),
                                text: m.content,
                                sender: m.sender?.role || 'system',
                                timestamp: new Date(m.createdAt).getTime(),
                                isInternal: m.isInternal,
                                type: 'text'
                            })),
                            nextCursor
                        };
                    }
                    return s;
                }));
            });
          }
      }
  }, [currentSessionId, role, sessions]);

  const loadMoreMessages = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.nextCursor || session.isLoadingMore) return;

    // Mark as loading
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isLoadingMore: true } : s));

    try {
      const { messages: dbMessages, nextCursor } = await getChatMessages(parseInt(sessionId), 50, session.nextCursor);
      
      const newMessages = dbMessages.map(m => ({
        id: m.id.toString(),
        text: m.content,
        sender: m.sender?.role || 'system',
        timestamp: new Date(m.createdAt).getTime(),
        isInternal: m.isInternal,
        type: 'text' as const
      }));

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...newMessages, ...s.messages], // Add older messages to the top
            nextCursor,
            isLoadingMore: false
          };
        }
        return s;
      }));
    } catch (error) {
      console.error("Failed to load more messages", error);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isLoadingMore: false } : s));
    }
  };


  const createNewChat = async () => {
      if (role === 'guest') {
          alert("Пожалуйста, войдите или зарегистрируйтесь, чтобы начать чат.");
          return;
      }
      const res = await createChatSession(getCsrfToken());
      if (res.success && res.chatId) {
          setCurrentSessionId(res.chatId.toString());
          fetchChats();
          setIsOpen(true);
      }
  };

  const toggleChat = () => setIsOpen(prev => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = async (text: string, isInternal: boolean = false) => {
    if (!text.trim()) return;
    
    // Optimistic update
    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text,
      sender: role,
      timestamp: Date.now(),
      isInternal
    };

    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [...session.messages, newMessage],
        };
      }
      return session;
    }));

    if (currentSessionId && role !== 'guest') {
        await serverSendMessage(parseInt(currentSessionId), text, getCsrfToken(), isInternal);
        // Refresh to get real ID and confirmed state
        fetchChats();
    }
  };

  return (
    <ChatContext.Provider value={{ 
      sessions, 
      currentSessionId, 
      role, 
      isOpen, 
      toggleChat, 
      openChat, 
      closeChat, 
      sendMessage, 
      selectSession: setCurrentSessionId,
      currentUserRole: role,
      setRole,
      createNewChat,
      refreshChats: fetchChats,
      loadMoreMessages
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
