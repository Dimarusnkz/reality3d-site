"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useChat } from "./chat-provider";
import { ChatWindow } from "./chat-window";
import { cn } from "@/lib/utils";

export function ChatWidget() {
  const { isOpen, toggleChat, role, sessions, currentSessionId } = useChat();
  const pathname = usePathname();

  // Don't show floating widget on admin pages, as they have a dedicated dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // Calculate unread count for client
  const currentSession = sessions.find(s => s.id === currentSessionId);
  // For client, we just want to know if there are messages from manager that are 'unread' (simplified logic here)
  // In a real app, we'd track 'lastReadTimestamp'
  const unreadCount = 0; // Simplified for now

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <ChatWindow />
        </div>
      )}

      <button
        onClick={toggleChat}
        className={cn(
          "h-14 w-14 rounded-full shadow-[0_0_20px_rgba(255,94,0,0.3)] flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
          isOpen ? "bg-slate-800 text-white rotate-90" : "bg-primary text-white hover:bg-primary/90"
        )}
      >
        <MessageCircle className={cn("h-7 w-7 transition-transform", isOpen && "-rotate-90")} />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-black">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
