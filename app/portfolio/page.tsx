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
    <div className="container mx-auto py-16 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase">Портфолио</h1>
          <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-[10px]">Showcase of our best 3D printing projects</p>
        </div>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800 backdrop-blur-sm">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                filter === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-gray-500 hover:text-white hover:bg-slate-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-32 bg-slate-900/20 rounded-3xl border border-dashed border-slate-800">
          <p className="text-gray-600 font-bold uppercase tracking-widest text-xs italic">В этой категории пока нет проектов</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {filteredProjects.map((project) => (
            <div key={project.id} className="group relative neon-card border border-slate-800 bg-slate-900/40 rounded-3xl overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,94,0,0.1)]">
              <div className="aspect-[16/10] relative overflow-hidden bg-slate-950">
                 <Image
                   src={project.imageUrl}
                   alt={project.title}
                   fill
                   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                   className="object-cover transition-transform duration-700 group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100 flex flex-col items-center justify-end p-8 text-center backdrop-blur-[1px] group-hover:backdrop-blur-[3px]">
                   <h3 className="text-2xl font-black text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-all duration-500 tracking-tight">{project.title}</h3>
                   <p className="text-sm text-gray-500 mb-6 translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 line-clamp-2 max-w-[280px]">{project.description}</p>
                   <div className="translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-150">
                      <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/30 bg-primary/5 px-6 py-2.5 rounded-full hover:bg-primary hover:text-white transition-colors cursor-pointer">
                        Подробнее
                      </span>
                   </div>
                 </div>
                 <div className="absolute top-4 left-4">
                   <span className="px-3 py-1 bg-primary/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary rounded-full border border-primary/20 shadow-lg shadow-primary/5">
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
