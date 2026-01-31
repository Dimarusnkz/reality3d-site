"use client";

import React from "react";
import { MessageSquare, User, Clock, Shield, Wrench, Briefcase } from "lucide-react";
import { useChat, SenderRole } from "@/app/components/chat/chat-provider";
import { ChatWindow } from "@/app/components/chat/chat-window";
import { cn } from "@/lib/utils";

export default function AdminChatPage() {
  const { sessions, currentSessionId, selectSession, role, setRole } = useChat();

  // Sort sessions by last message timestamp
  const sortedSessions = [...sessions].sort((a, b) => {
    const timeA = a.lastMessage?.timestamp || 0;
    const timeB = b.lastMessage?.timestamp || 0;
    return timeB - timeA;
  });

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-3xl font-bold text-white">Чат с клиентами</h1>
        
        {/* Role Switcher for Demo Purposes */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
           <span className="text-xs text-gray-500 px-2">Ваша роль:</span>
           {(["manager", "engineer", "admin"] as SenderRole[]).map((r) => (
             <button
               key={r}
               onClick={() => setRole(r)}
               className={cn(
                 "px-3 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1",
                 role === r 
                   ? "bg-primary text-white" 
                   : "text-gray-400 hover:text-white hover:bg-slate-800"
               )}
             >
               {r === "manager" && <Briefcase className="h-3 w-3" />}
               {r === "engineer" && <Wrench className="h-3 w-3" />}
               {r === "admin" && <Shield className="h-3 w-3" />}
               {r === "manager" ? "Менеджер" : r === "engineer" ? "Инженер" : "Админ"}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className="w-80 flex flex-col gap-4 shrink-0">
          <div className="neon-card rounded-xl p-4 flex-1 overflow-y-auto">
             <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Активные диалоги</h3>
             <div className="space-y-2">
               {sortedSessions.length === 0 ? (
                 <p className="text-sm text-gray-500 text-center py-4">Нет активных чатов</p>
               ) : (
                 sortedSessions.map((session) => (
                   <button
                     key={session.id}
                     onClick={() => selectSession(session.id)}
                     className={cn(
                       "w-full text-left p-3 rounded-lg transition-all border border-transparent",
                       currentSessionId === session.id
                         ? "bg-slate-800 border-primary/50 shadow-[0_0_10px_rgba(255,94,0,0.1)]"
                         : "hover:bg-slate-900 border-slate-800/50"
                     )}
                   >
                     <div className="flex justify-between items-start mb-1">
                       <span className="font-bold text-white truncate">{session.clientName}</span>
                       {session.lastMessage && (
                         <span className="text-[10px] text-gray-500">
                           {new Date(session.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                       )}
                     </div>
                     <div className="flex justify-between items-end">
                       <p className="text-xs text-gray-400 truncate max-w-[180px]">
                         {session.lastMessage?.text || "Нет сообщений"}
                       </p>
                       {session.unreadCount > 0 && (
                         <span className="h-5 min-w-[20px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                           {session.unreadCount}
                         </span>
                       )}
                     </div>
                   </button>
                 ))
               )}
             </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          <ChatWindow embedded className="flex-1" />
          
          <div className="mt-4 p-4 neon-card rounded-xl text-xs text-gray-400">
             <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Права доступа:
             </h4>
             <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <li className={cn("p-2 rounded bg-slate-900/50", role === "manager" && "ring-1 ring-primary")}>
                   <strong className="text-white block mb-1">Менеджер</strong>
                   Принимает сообщения, отвечает клиентам.
                </li>
                <li className={cn("p-2 rounded bg-slate-900/50", role === "engineer" && "ring-1 ring-primary")}>
                   <strong className="text-white block mb-1">Инженер</strong>
                   Видит чат, может оставлять внутренние комментарии (желтые).
                </li>
                <li className={cn("p-2 rounded bg-slate-900/50", role === "admin" && "ring-1 ring-primary")}>
                   <strong className="text-white block mb-1">Администратор</strong>
                   Полный доступ ко всем функциям.
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
