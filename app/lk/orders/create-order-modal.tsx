"use client";

import { useState, useRef } from "react";
import { X, Upload, Loader2, FileIcon, Trash2 } from "lucide-react";
import { createOrder } from "@/app/actions/orders";
import { uploadFile } from "@/app/actions/upload";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedFile {
  originalName: string;
  fileName: string;
  size: number;
  path: string;
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: CreateOrderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    uploadedFiles: [] as UploadedFile[],
  });

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const data = new FormData();
      data.append('csrf_token', getCsrfToken());
      data.append('file', file);
      
      const res = await uploadFile(data);
      if (res.success && res.file) {
        setFormData(prev => ({
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, res.file!]
        }));
      } else {
        alert(`Ошибка загрузки ${file.name}: ${res.error}`);
      }
    }
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileName: string) => {
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter(f => f.fileName !== fileName)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const csrfToken = getCsrfToken();
    const res = await createOrder({
      title: formData.title,
      details: {
        description: formData.description,
        files: formData.uploadedFiles
      },
      csrfToken,
    });

    setIsLoading(false);

    if (res.success) {
      setFormData({ title: "", description: "", uploadedFiles: [] });
      onSuccess();
      onClose();
    } else {
      alert("Не удалось создать заказ");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Новый заказ</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Название заказа
              </label>
              <input
                type="text"
                required
                placeholder="Например: Печать корпуса"
                className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Описание / ТЗ
              </label>
              <textarea
                required
                placeholder="Опишите задачу, укажите материалы, цвет, количество..."
                className="w-full bg-black/50 border border-slate-800 rounded-lg px-4 py-3 text-white h-32 resize-none focus:outline-none focus:border-primary/50 transition-colors"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Файлы (STL, OBJ, STEP)
              </label>
              
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept=".stl,.obj,.step,.stp"
                onChange={handleFileSelect}
              />

              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-800 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-black/30 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 mb-2 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 mb-2" />
                )}
                <span className="text-sm">
                  {isUploading ? "Загрузка..." : "Загрузить файлы"}
                </span>
                <span className="text-xs text-gray-600 mt-1">Макс. 50MB</span>
              </div>

              {/* File List */}
              {formData.uploadedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {formData.uploadedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm text-gray-200 truncate">{file.originalName}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.fileName)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isUploading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(255,94,0,0.3)] hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Создание...
                </>
              ) : (
                "Создать заказ"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
