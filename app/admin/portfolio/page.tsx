"use client";

import { useState } from "react";
import { Plus, Search, Image as ImageIcon, Trash2, X, ExternalLink, Edit } from "lucide-react";
import { usePortfolio } from "@/app/context/portfolio-context";
import { cn } from "@/lib/utils";

export default function AdminPortfolioPage() {
  const { projects, addProject, editProject, deleteProject } = usePortfolio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    category: "Прототипы"
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", description: "", imageUrl: "", category: "Прототипы" });
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: any) => {
    setFormData({
      title: project.title,
      description: project.description,
      imageUrl: project.imageUrl,
      category: project.category
    });
    setEditingId(project.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      editProject(editingId, {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || `https://placehold.co/600x400/1a1a1a/orange?text=${encodeURIComponent(formData.title)}`,
        category: formData.category
      });
    } else {
      addProject({
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl || `https://placehold.co/600x400/1a1a1a/orange?text=${encodeURIComponent(formData.title)}`,
        category: formData.category
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const categories = ["Прототипы", "Макеты", "Арт", "Детали", "Ювелирка"];

  return (
    <div className="space-y-6 relative">
       {/* Header and Add Button */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Портфолио</h1>
          <p className="text-gray-400">Управление проектами и примерами работ</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="neon-button flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить проект
        </button>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-primary/50 transition-all">
            <div className="aspect-video relative overflow-hidden bg-slate-950">
               {/* Use img tag for simplicity or Next Image if configured */}
               <img 
                 src={project.imageUrl} 
                 alt={project.title} 
                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
               
               {/* Actions Overlay */}
               <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEdit(project)}
                    className="p-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => deleteProject(project.id)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg backdrop-blur-sm transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
               </div>
               
               <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white border border-white/10">
                 {project.category}
               </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white text-lg mb-1 truncate">{project.title}</h3>
              <p className="text-sm text-gray-400 line-clamp-2 h-10">{project.description}</p>
              <div className="mt-4 text-xs text-gray-500 flex justify-between items-center">
                 <span>{new Date(project.date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="neon-card w-full max-w-lg p-6 rounded-xl relative animate-in fade-in zoom-in duration-200 bg-slate-950">
             <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-white mb-6">
              {editingId ? "Редактировать проект" : "Добавить проект"}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Название проекта</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                  placeholder="Например: Макет стадиона"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData({...formData, category: cat})}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        formData.category === cat 
                          ? "bg-primary/20 border-primary text-primary" 
                          : "bg-slate-900 border-slate-800 text-gray-400 hover:border-slate-600"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Изображение (Ссылка или Файл)</label>
                <div className="space-y-3">
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input 
                      type="url" 
                      value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-400
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-xs file:font-semibold
                        file:bg-slate-800 file:text-primary
                        hover:file:bg-slate-700
                        cursor-pointer"
                    />
                  </div>

                  {formData.imageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-800">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, imageUrl: ""})}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Описание</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors h-24 resize-none"
                  placeholder="Описание задачи, использованные технологии и материалы..."
                />
              </div>

              <button type="submit" className="neon-button w-full mt-2">
                {editingId ? "Сохранить изменения" : "Опубликовать в портфолио"}
              </button>
            </form>
           </div>
        </div>
      )}
    </div>
  );
}
