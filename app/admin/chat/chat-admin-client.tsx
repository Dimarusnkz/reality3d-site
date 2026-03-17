"use client";

import React from "react";
import { useChat } from "@/app/components/chat/chat-provider";
import { ChatWindow } from "@/app/components/chat/chat-window";
import { Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminChatClient() {
  const { sessions, selectSession, currentSessionId } = useChat();
  const [filter, setFilter] = React.useState("all"); // all, unread, active
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" ? true : 
                          filter === "unread" ? session.unreadCount > 0 :
                          session.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Чаты
            <span className="text-sm font-normal text-gray-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {sessions.length}
            </span>
          </h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Поиск чата..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 text-xs overflow-x-auto pb-2">
            <button 
              onClick={() => setFilter("all")}
              className={cn("px-3 py-1 rounded-full transition-colors whitespace-nowrap", filter === "all" ? "bg-primary text-white" : "bg-slate-800 text-gray-400 hover:text-white")}
            >
              Все
            </button>
            <button 
              onClick={() => setFilter("unread")}
              className={cn("px-3 py-1 rounded-full transition-colors whitespace-nowrap", filter === "unread" ? "bg-primary text-white" : "bg-slate-800 text-gray-400 hover:text-white")}
            >
              Непрочитанные
            </button>
            <button 
              onClick={() => setFilter("active")}
              className={cn("px-3 py-1 rounded-full transition-colors whitespace-nowrap", filter === "active" ? "bg-primary text-white" : "bg-slate-800 text-gray-400 hover:text-white")}
            >
              Активные
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Чаты не найдены
            </div>
          ) : (
            filteredSessions.map(session => (
              <div 
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={cn(
                  "p-4 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors",
                  currentSessionId === session.id ? "bg-slate-800/80 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-white truncate max-w-[70%]">{session.clientName}</h3>
                  <span className="text-xs text-gray-500">
                     {session.lastMessage ? new Date(session.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-sm text-gray-400 truncate max-w-[80%]">
                    {session.lastMessage?.text || "Нет сообщений"}
                  </p>
                  {session.unreadCount > 0 && (
                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {session.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
        {currentSessionId ? (
          <ChatWindow embedded className="h-full w-full border-0 shadow-none bg-transparent" />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Выберите чат для просмотра</p>
            <p className="text-sm">Здесь будет история переписки и инструменты управления</p>
          </div>
        )}
      </div>
    </div>
  );
}
