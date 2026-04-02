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
  latestMessageId?: number;
  isLoadingMore?: boolean;
  isPolling?: boolean;
  lastPollAt?: number;
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
    if (role === 'guest') return;
    try {
      const dbChats = await getChats();
      
      setSessions(prev => {
        return dbChats.map(chat => {
          const oldS = prev.find(p => p.id === chat.id.toString());
          return {
            id: chat.id.toString(),
            dbId: chat.id,
            clientName: chat.user.name || chat.user.email,
            messages: oldS?.messages || [],
            unreadCount: chat.unreadCount || 0,
            clientUnreadCount: (role === 'user' || role === 'client') ? (chat.unreadCount || 0) : 0, 
            status: chat.status as any,
            nextCursor: oldS?.nextCursor,
            latestMessageId: oldS?.latestMessageId,
            lastPollAt: oldS?.lastPollAt
          };
        });
      });
      
      if ((role === 'user' || role === 'client') && dbChats.length === 1 && !currentSessionId) {
          setCurrentSessionId(dbChats[0].id.toString());
      }
    } catch (error) {
      console.error("Failed to fetch chats", error);
    }
  }, [role, currentSessionId]);

  const pollNewMessages = useCallback(async () => {
    if (!currentSessionId || role === 'guest') return;
    
    // Use functional update to get the most recent sessions
    setSessions(prev => {
      const session = prev.find(s => s.id === currentSessionId);
      if (!session || session.isPolling) return prev;

      const now = Date.now();
      if (session.lastPollAt && now - session.lastPollAt < 4000) return prev;

      // Mark as polling immediately in the state
      const updatedSessions = prev.map(s => s.id === currentSessionId ? { ...s, isPolling: true, lastPollAt: now } : s);

      // Start async fetch
      (async () => {
        try {
          if (session.messages.length === 0) {
            const { messages: dbMessages, nextCursor } = await getChatMessages(session.dbId);
            const mappedMessages = dbMessages.map(m => ({
              id: m.id.toString(),
              text: m.content,
              sender: m.sender?.role || 'system',
              timestamp: new Date(m.createdAt).getTime(),
              isInternal: m.isInternal,
              type: 'text' as const
            }));

            setSessions(curr => curr.map(s => {
              if (s.id === currentSessionId) {
                return {
                  ...s,
                  messages: mappedMessages,
                  nextCursor,
                  latestMessageId: dbMessages.length > 0 ? dbMessages[dbMessages.length - 1].id : undefined,
                  isPolling: false
                };
              }
              return s;
            }));
          } else {
            const { messages: newDbMessages } = await getChatMessages(
              session.dbId, 
              20, 
              session.latestMessageId, 
              'newer'
            );

            setSessions(curr => curr.map(s => {
              if (s.id === currentSessionId) {
                if (newDbMessages.length > 0) {
                  const mappedNew = newDbMessages.map(m => ({
                    id: m.id.toString(),
                    text: m.content,
                    sender: m.sender?.role || 'system',
                    timestamp: new Date(m.createdAt).getTime(),
                    isInternal: m.isInternal,
                    type: 'text' as const
                  }));

                  const existingIds = new Set(s.messages.map(m => m.id));
                  const filteredNew = mappedNew.filter(m => !existingIds.has(m.id));
                  
                  return {
                    ...s,
                    messages: [...s.messages, ...filteredNew],
                    latestMessageId: newDbMessages[newDbMessages.length - 1].id,
                    isPolling: false
                  };
                }
                return { ...s, isPolling: false };
              }
              return s;
            }));
          }
        } catch (error) {
          console.error("Polling error", error);
          setSessions(curr => curr.map(s => s.id === currentSessionId ? { ...s, isPolling: false } : s));
        }
      })();

      return updatedSessions;
    });
  }, [currentSessionId, role]);

  // Initial fetch and polling for chat list
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 30000); // Poll list less often (30s)
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Poll for messages in CURRENT session
  useEffect(() => {
    if (!currentSessionId || role === 'guest') return;
    pollNewMessages();
    const interval = setInterval(pollNewMessages, 5000); // Poll messages every 5s
    return () => clearInterval(interval);
  }, [currentSessionId, role]); // Trigger when current session changes

  // Load initial messages when session is selected (if not already loading via poll)
  useEffect(() => {
      if (currentSessionId && role !== 'guest') {
          const session = sessions.find(s => s.id === currentSessionId);
          if (session && session.messages.length === 0 && !session.isPolling) {
            pollNewMessages();
          }
      }
  }, [currentSessionId, role]);

  const loadMoreMessages = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session || !session.nextCursor || session.isLoadingMore) return;

    // Mark as loading
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isLoadingMore: true } : s));

    try {
      const { messages: dbMessages, nextCursor } = await getChatMessages(session.dbId, 50, session.nextCursor, 'older');
      
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
          const nextLatestId = dbMessages.length > 0 ? Math.max(s.latestMessageId || 0, ...dbMessages.map(m => m.id)) : s.latestMessageId;
          return {
            ...s,
            messages: [...newMessages, ...s.messages], // Add older messages to the top
            nextCursor,
            latestMessageId: nextLatestId,
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
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      text,
      sender: role,
      timestamp: Date.now(),
      isInternal,
      type: 'text'
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
        
        // After sending, trigger immediate poll to confirm message and update IDs
        pollNewMessages();
    }
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const refreshChats = useCallback(async () => {
    await fetchChats();
  }, [fetchChats]);

  return (
    <ChatContext.Provider 
      value={{ 
        sessions, 
        currentSessionId, 
        role, 
        isOpen, 
        toggleChat, 
        openChat, 
        closeChat, 
        sendMessage, 
        selectSession,
        currentUserRole: role,
        setRole,
        createNewChat,
        refreshChats,
        loadMoreMessages
      }}
    >
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
