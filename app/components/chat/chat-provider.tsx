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
        // Fetch messages for each chat (or optimize to fetch only for active/selected)
        // For list view, we might need last message.
        // For now, let's just fetch messages for the CURRENT session to save bandwidth, 
        // or fetch all if list is small. 
        // Let's optimize: fetch messages only if it's the current session.
        // But for "unread" counts and last message preview, we usually need them.
        // Let's rely on what `getChats` returns. `getChats` returns unreadCount.
        
        // We'll fetch full messages only for the active session.
        let messages: Message[] = [];
        if (currentSessionId === chat.id.toString()) {
             const dbMessages = await getChatMessages(chat.id);
             messages = dbMessages.map(m => ({
                 id: m.id.toString(),
                 text: m.content,
                 sender: m.sender?.role || 'system',
                 timestamp: new Date(m.createdAt).getTime(),
                 isInternal: m.isInternal,
                 type: 'text'
             }));
        }

        return {
          id: chat.id.toString(),
          dbId: chat.id,
          clientName: chat.user.name || chat.user.email,
          messages: messages, // Will be empty unless selected
          unreadCount: chat.unreadCount || 0,
          clientUnreadCount: (role === 'user' || role === 'client') ? (chat.unreadCount || 0) : 0, 
          status: chat.status as any
        };
      }));

      setSessions(prev => {
         // Merge with previous to keep messages if we didn't fetch them
         // This is a bit complex. Simplification:
         // If we fetched messages (current session), use them.
         // If not, keep existing messages from `prev` if available.
         return mappedSessions.map(newS => {
             const oldS = prev.find(p => p.id === newS.id);
             if (newS.id === currentSessionId) return newS; // We fetched messages
             return { ...newS, messages: oldS?.messages || [] };
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
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Load messages when session is selected
  useEffect(() => {
      if (currentSessionId && role !== 'guest') {
          // Immediately fetch messages for the selected session
          getChatMessages(parseInt(currentSessionId)).then(dbMessages => {
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
                          }))
                      };
                  }
                  return s;
              }));
          });
      }
  }, [currentSessionId, role]);


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
      refreshChats: fetchChats
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
