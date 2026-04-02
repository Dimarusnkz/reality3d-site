"use client";

import React from "react";
import { useChat } from "@/app/components/chat/chat-provider";
import { ChatWindow } from "@/app/components/chat/chat-window";
import { MessageSquare, Search, User, Clock, CheckCircle2, Archive } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminChatClient() {
  const { sessions, currentSessionId, selectSession } = useChat();
  const [search, setSearch] = React.useState("");

  const filteredSessions = sessions.filter(s => 
    s.clientName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Поиск клиента..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Чаты не найдены
            </div>
          ) : (
            filteredSessions.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSession(s.id)}
                className={cn(
                  "w-full p-4 flex items-start gap-3 border-b border-slate-800/50 hover:bg-slate-900/50 transition-colors text-left",
                  currentSessionId === s.id && "bg-primary/10 border-r-2 border-r-primary"
                )}
              >
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-white truncate">{s.clientName}</span>
                    {s.unreadCount > 0 && (
                      <span className="bg-primary text-[10px] text-white px-1.5 py-0.5 rounded-full font-black">
                        {s.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                     {s.messages.length > 0 ? s.messages[s.messages.length - 1].text : "Нет сообщений"}
                   </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-900/20">
        {currentSessionId ? (
          <ChatWindow embedded className="border-0 rounded-none h-full" />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
            <div className="h-20 w-20 rounded-full bg-slate-900 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Выберите диалог</h3>
            <p className="text-sm text-center max-w-xs">
              Выберите чат из списка слева, чтобы просмотреть историю сообщений и ответить клиенту.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
