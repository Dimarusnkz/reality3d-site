"use client";

import Image from "next/image";
import { usePortfolio } from "@/app/context/portfolio-context";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function PortfolioPage() {
  const { projects } = usePortfolio();
  const [filter, setFilter] = useState("Все");

  const categories = ["Все", "Прототипы", "Макеты", "Арт", "Детали", "Ювелирка"];

  const filteredProjects = filter === "Все" 
    ? projects 
    : projects.filter(p => p.category === filter);

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Портфолио</h1>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                filter === cat
                  ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(255,165,0,0.5)]"
                  : "bg-slate-900 text-gray-400 hover:text-white border border-slate-800 hover:border-slate-600"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p>В этой категории пока нет проектов.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,165,0,0.15)]">
              <div className="aspect-square relative overflow-hidden bg-slate-950">
                 {/* Use img for simplicity or Next Image */}
                 <img 
                   src={project.imageUrl} 
                   alt={project.title} 
                   className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                   <h3 className="text-xl font-bold text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{project.title}</h3>
                   <p className="text-sm text-gray-300 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 line-clamp-3">{project.description}</p>
                   <span className="text-primary text-sm font-bold border border-primary/50 px-4 py-2 rounded-full translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-100">
                     Подробнее
                   </span>
                 </div>
                 <div className="absolute top-4 left-4">
                   <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-xs font-bold text-white rounded-full border border-white/10">
                     {project.category}
                   </span>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
