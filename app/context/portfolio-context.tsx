"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  date: string;
}

interface PortfolioContextType {
  projects: PortfolioItem[];
  addProject: (project: Omit<PortfolioItem, "id" | "date">) => void;
  editProject: (id: string, updatedProject: Partial<Omit<PortfolioItem, "id" | "date">>) => void;
  deleteProject: (id: string) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

const MOCK_PROJECTS: PortfolioItem[] = [
  {
    id: "1",
    title: "Архитектурный макет ЖК",
    description: "Детализированный макет жилого комплекса в масштабе 1:200. Выполнен методом SLA печати для высокой точности.",
    imageUrl: "https://placehold.co/600x400/1a1a1a/orange?text=Project+1",
    category: "Макеты",
    date: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Прототип корпуса прибора",
    description: "Функциональный прототип корпуса из ABS пластика. FDM печать с последующей шлифовкой.",
    imageUrl: "https://placehold.co/600x400/1a1a1a/blue?text=Project+2",
    category: "Прототипы",
    date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "3",
    title: "Фигурка персонажа",
    description: "Коллекционная фигурка высотой 15см. Фотополимерная печать, ручная роспись.",
    imageUrl: "https://placehold.co/600x400/1a1a1a/purple?text=Project+3",
    category: "Арт",
    date: new Date(Date.now() - 172800000).toISOString(),
  }
];

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("reality3d_portfolio");
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      setProjects(MOCK_PROJECTS);
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem("reality3d_portfolio", JSON.stringify(projects));
    }
  }, [projects]);

  const addProject = (project: Omit<PortfolioItem, "id" | "date">) => {
    const newProject: PortfolioItem = {
      ...project,
      id: Date.now().toString(),
      date: new Date().toISOString(),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const editProject = (id: string, updatedProject: Partial<Omit<PortfolioItem, "id" | "date">>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updatedProject } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <PortfolioContext.Provider value={{ projects, addProject, editProject, deleteProject }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
