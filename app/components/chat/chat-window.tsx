"use client";

import React, { useRef, useEffect } from "react";
import { Send, X, Paperclip, MessageSquare } from "lucide-react";
import { useChat, Message } from "./chat-provider";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  className?: string;
  embedded?: boolean;
}

export function ChatWindow({ className, embedded = false }: ChatWindowProps) {
  const { 
    sessions, 
    currentSessionId, 
    role, 
    sendMessage, 
    closeChat, 
    currentUserRole 
  } = useChat();

  const [input, setInput] = React.useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentSessionId]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleInternalComment = () => {
    if (!input.trim()) return;
    sendMessage(input, true); // Internal
    setInput("");
  };

  if (!currentSession && role !== "client") {
    return (
       <div className={cn("flex items-center justify-center h-full text-gray-500", className)}>
          Выберите чат для начала общения
       </div>
    );
  }

  return (
    <div className={cn("flex flex-col bg-slate-900 border border-slate-800 overflow-hidden", embedded ? "h-full rounded-xl" : "h-[500px] w-[350px] rounded-t-xl shadow-2xl", className)}>
      {/* Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <h3 className="font-bold text-white">
              {role === "client" ? "Поддержка Reality3D" : currentSession?.clientName || "Чат"}
           </h3>
        </div>
        {!embedded && (
          <button onClick={closeChat} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
        {messages.length === 0 && (
           <div className="text-center text-gray-500 mt-10">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>Нет сообщений. Напишите нам!</p>
           </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.sender === role;
          // Internal messages are only visible to staff
          if (msg.isInternal && role === "client") return null;

          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[80%]", 
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div 
                className={cn(
                  "p-3 rounded-2xl text-sm",
                  msg.isInternal 
                    ? "bg-yellow-500/10 border border-yellow-500/50 text-yellow-200" // Internal comment style
                    : isMe 
                      ? "bg-primary text-white rounded-br-none" 
                      : "bg-slate-800 text-gray-200 rounded-bl-none"
                )}
              >
                {msg.isInternal && <span className="text-[10px] uppercase font-bold text-yellow-500 block mb-1">Комментарий</span>}
                {msg.text}
              </div>
              <span className="text-[10px] text-gray-500 mt-1">
                 {msg.sender === "client" ? "Клиент" : msg.sender === "manager" ? "Менеджер" : msg.sender === "engineer" ? "Инженер" : "Админ"} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          {/* File attachment mock */}
          <button type="button" className="text-gray-400 hover:text-primary transition-colors">
             <Paperclip className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={role === "engineer" ? "Написать комментарий..." : "Введите сообщение..."}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          />
          
          {(role === "engineer" || role === "admin" || role === "manager") && (
             <button 
               type="button" 
               onClick={handleInternalComment}
               title="Внутренний комментарий"
               className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded-full transition-colors"
             >
                <MessageSquare className="h-5 w-5" />
             </button>
          )}

          <button 
            type="submit" 
            disabled={!input.trim()}
            className="p-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
