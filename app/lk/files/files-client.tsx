"use client";

import { FileText, Download, Clock, ShoppingBag, MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface FileItem {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  orderId?: number;
  orderTitle?: string;
  chatSessionId?: number;
  createdAt: string;
}

export default function FilesClient({ initialFiles }: { initialFiles: FileItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFiles = initialFiles.filter(file => 
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.orderTitle && file.orderTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "—";
    const k = 1024;
    const sizes = ["Б", "КБ", "МБ", "ГБ"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Мои файлы</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Your 3D models and project documents</p>
        </div>
        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Поиск по названию..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800 shadow-inner">
            <FileText className="h-8 w-8 text-gray-700" />
          </div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs italic">Файлы не найдены</p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="mt-4 text-[10px] font-black text-primary hover:text-white transition-colors uppercase tracking-[0.2em]"
            >
              Сбросить поиск
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file, idx) => (
            <div key={`${file.fileUrl}-${idx}`} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-6 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,94,0,0.1)] flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="h-16 w-16 text-primary" />
              </div>
              
              <div className="flex items-start gap-4 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-primary/5 transition-colors">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-white truncate tracking-tight group-hover:text-primary transition-colors">{file.fileName}</h3>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mt-1">{formatFileSize(file.fileSize)}</p>
                </div>
              </div>

              <div className="space-y-3 mb-8 relative z-10">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                  <Clock className="w-3 h-3 opacity-50" />
                  {new Date(file.createdAt).toLocaleDateString('ru-RU')}
                </div>
                {file.orderId ? (
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                    <ShoppingBag className="w-3 h-3 opacity-50" />
                    Заказ #{file.orderId}
                  </div>
                ) : file.chatSessionId ? (
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
                    <MessageSquare className="w-3 h-3 opacity-50" />
                    Из чата
                  </div>
                ) : null}
              </div>

              <a 
                href={file.fileUrl} 
                download={file.fileName}
                className="mt-auto w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-primary hover:border-primary transition-all duration-300 shadow-inner group/btn"
              >
                <Download className="w-3.5 h-3.5 group-hover/btn:animate-bounce" />
                Скачать файл
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
