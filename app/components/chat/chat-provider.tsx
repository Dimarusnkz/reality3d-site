"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export type MessageType = "text" | "image";
export type SenderRole = "client" | "manager" | "engineer" | "admin";

export interface Message {
  id: string;
  text: string;
  sender: SenderRole;
  timestamp: number;
  isInternal?: boolean; // For engineer/manager comments
  type?: MessageType;
}

export interface ChatSession {
  id: string;
  clientName: string;
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  status: "active" | "closed";
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null; // For client, this is their session. For manager, this is selected session.
  role: SenderRole;
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string, isInternal?: boolean) => void;
  selectSession: (sessionId: string) => void;
  currentUserRole: SenderRole; // The actual role of the user using the app
  setRole: (role: SenderRole) => void; // For testing/demo
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  // Determine initial role based on path
  const [role, setRole] = useState<SenderRole>("client");

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setRole("manager"); // Default to manager in admin panel, can be switched
    } else {
      setRole("client");
    }
  }, [pathname]);

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem("reality3d_chat");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setSessions(data.sessions || []);
        
        // If client, ensure they have a session
        if (!pathname?.startsWith("/admin")) {
           // Try to find existing client session or create one
           // For simplicity in this demo, we'll just pick the first one or create new
           if (data.clientSessionId) {
             setCurrentSessionId(data.clientSessionId);
           } else {
             const newId = Date.now().toString();
             const newSession: ChatSession = {
               id: newId,
               clientName: "Гость " + newId.slice(-4),
               messages: [],
               unreadCount: 0,
               status: "active"
             };
             setSessions(prev => [...prev, newSession]);
             setCurrentSessionId(newId);
             localStorage.setItem("reality3d_chat", JSON.stringify({
               sessions: [...(data.sessions || []), newSession],
               clientSessionId: newId
             }));
           }
        }
      } catch (e) {
        console.error("Failed to parse chat storage", e);
      }
    } else {
      // Initialize
      if (!pathname?.startsWith("/admin")) {
         const newId = Date.now().toString();
         const newSession: ChatSession = {
           id: newId,
           clientName: "Гость " + newId.slice(-4),
           messages: [{
             id: "welcome",
             text: "Здравствуйте! Чем мы можем вам помочь?",
             sender: "manager",
             timestamp: Date.now()
           }],
           unreadCount: 1,
           status: "active"
         };
         setSessions([newSession]);
         setCurrentSessionId(newId);
         localStorage.setItem("reality3d_chat", JSON.stringify({
           sessions: [newSession],
           clientSessionId: newId
         }));
      }
    }
  }, [pathname]);

  // Save to local storage on change
  useEffect(() => {
    if (sessions.length > 0) {
      const stored = localStorage.getItem("reality3d_chat");
      let clientSessionId = currentSessionId;
      if (stored) {
         const data = JSON.parse(stored);
         // Keep the client's session ID if we are in admin mode (don't overwrite with null or selected)
         if (!pathname?.startsWith("/admin")) {
            clientSessionId = currentSessionId;
         } else {
            clientSessionId = data.clientSessionId;
         }
      }
      
      localStorage.setItem("reality3d_chat", JSON.stringify({
        sessions,
        clientSessionId
      }));
    }
  }, [sessions, currentSessionId, pathname]);

  const toggleChat = () => setIsOpen(prev => !prev);
  const openChat = () => setIsOpen(true);
  const closeChat = () => setIsOpen(false);

  const sendMessage = (text: string, isInternal: boolean = false) => {
    if (!text.trim()) return;
    
    if (!currentSessionId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
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
          lastMessage: newMessage,
          unreadCount: role === "client" ? session.unreadCount + 1 : 0 // If client sends, increment unread for manager
        };
      }
      return session;
    }));
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    // Clear unread count when staff opens the chat
    if (role !== "client") {
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { ...s, unreadCount: 0 };
        }
        return s;
      }));
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
      selectSession,
      currentUserRole: role,
      setRole
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
