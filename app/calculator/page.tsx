"use client";

import { useState } from "react";
import { Upload, FileBox, Calculator, Info, Check, Zap, Layers, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

const TECHNOLOGIES = [
  { id: "fdm", name: "FDM", icon: Cpu, desc: "Послойная печать пластиком. Прототипы, корпуса." },
  { id: "sla", name: "SLA", icon: Zap, desc: "Фотополимер. Высокая детализация, гладкость." },
  { id: "sls", name: "SLS", icon: Layers, desc: "Полиамид. Промышленные детали без поддержек." },
];

const MATERIALS = {
  fdm: [
    { id: "pla", name: "PLA", price: 10, desc: "Экологичный, жесткий, легкий в печати" },
    { id: "abs", name: "ABS", price: 12, desc: "Прочный, термостойкий, ударопрочный" },
    { id: "petg", name: "PETG", price: 11, desc: "Химостойкий, прочный, без запаха" },
  ],
  sla: [
    { id: "standard", name: "Standard Resin", price: 25, desc: "Гладкая поверхность, высокая детализация" },
    { id: "tough", name: "Tough Resin", price: 35, desc: "Имитация ABS, высокая прочность" },
  ],
  sls: [
    { id: "pa12", name: "PA12 (Nylon)", price: 40, desc: "Универсальный полиамид, прочный и гибкий" },
  ],
};

export default function CalculatorPage() {
  const [mode, setMode] = useState<"file" | "manual">("file");
  const [file, setFile] = useState<File | null>(null);
  const [tech, setTech] = useState("fdm");
  const [material, setMaterial] = useState("pla");
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [count, setCount] = useState(1);

  // Manual params
  const [manualParams, setManualParams] = useState({
    weight: 0,
    time: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const calculatePrice = () => {
    let basePrice = 500; // Min order price
    if (mode === "manual") {
        basePrice += manualParams.weight * 15; // Mock price per gram
        basePrice += manualParams.time * 100; // Mock price per hour
    } else {
        // Mock calculation based on file size/complexity
        if (file) {
            basePrice += file.size / 1000; 
        }
    }
    
    // Material multiplier
    const matPrice = MATERIALS[tech as keyof typeof MATERIALS]?.find(m => m.id === material)?.price || 10;
    basePrice = basePrice + (matPrice * 10); // Simple mock logic

    return Math.round(basePrice * count);
  };

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-white">Калькулятор 3D-печати</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-900 rounded-lg w-fit border border-slate-800">
            <button
              onClick={() => setMode("file")}
              className={cn(
                "px-6 py-2 rounded-md text-sm font-medium transition-all",
                mode === "file" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Загрузить модель
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "px-6 py-2 rounded-md text-sm font-medium transition-all",
                mode === "manual" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
              )}
            >
              Расчет по параметрам
            </button>
          </div>

          {mode === "file" ? (
            <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-slate-900/50 hover:border-primary/50 transition-colors cursor-pointer relative group">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".stl,.obj,.step,.stp"
                onChange={handleFileChange}
              />
              {file ? (
                <>
                  <FileBox className="h-12 w-12 text-primary mb-4" />
                  <p className="text-lg font-medium text-white">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button className="mt-4 text-sm text-red-500 hover:underline z-10" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                    Удалить
                  </button>
                </>
              ) : (
                <>
                  <div className="p-4 bg-slate-900 rounded-full mb-4 group-hover:scale-110 transition-transform">
                     <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-lg font-medium text-white">Перетащите файл сюда</p>
                  <p className="text-sm text-gray-500 mt-2">STL, OBJ, STEP (до 100 МБ)</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-300">Вес (грамм)</label>
                 <input 
                   type="number" 
                   className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-primary outline-none transition-colors" 
                   value={manualParams.weight}
                   onChange={(e) => setManualParams({...manualParams, weight: Number(e.target.value)})}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium text-gray-300">Время печати (часов)</label>
                 <input 
                   type="number" 
                   className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-primary outline-none transition-colors"
                   value={manualParams.time}
                   onChange={(e) => setManualParams({...manualParams, time: Number(e.target.value)})}
                 />
               </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Настройки печати</h2>
            
            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400">Технология</label>
              <div className="grid gap-4 sm:grid-cols-3">
                {TECHNOLOGIES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTech(t.id); setMaterial(MATERIALS[t.id as keyof typeof MATERIALS][0].id); }}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all relative overflow-hidden",
                      tech === t.id 
                        ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,94,0,0.1)]" 
                        : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                       <t.icon className={cn("w-5 h-5", tech === t.id ? "text-primary" : "text-gray-500")} />
                       <span className={cn("font-bold", tech === t.id ? "text-white" : "text-gray-300")}>{t.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{t.desc}</div>
                    {tech === t.id && <div className="absolute inset-0 border-2 border-primary rounded-xl opacity-20 animate-pulse"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-gray-400">Материал</label>
              <div className="grid gap-4 sm:grid-cols-3">
                 {MATERIALS[tech as keyof typeof MATERIALS]?.map((m) => (
                   <button
                     key={m.id}
                     onClick={() => setMaterial(m.id)}
                     className={cn(
                       "p-4 rounded-xl border text-left transition-all",
                       material === m.id 
                         ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,94,0,0.1)]" 
                         : "border-slate-800 bg-slate-900/50 hover:border-slate-600"
                     )}
                   >
                     <div className="flex justify-between items-center mb-1">
                       <span className={cn("font-bold", material === m.id ? "text-white" : "text-gray-300")}>{m.name}</span>
                       {material === m.id && <Check className="h-4 w-4 text-primary" />}
                     </div>
                     <div className="text-xs text-gray-500">{m.desc}</div>
                   </button>
                 ))}
              </div>
            </div>

            {tech === "fdm" && (
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium text-gray-400">Заполнение</label>
                    <span className="text-sm text-primary font-bold">{infill}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="5" 
                    value={infill} 
                    onChange={(e) => setInfill(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                     <label className="text-sm font-medium text-gray-400">Высота слоя</label>
                     <span className="text-sm text-primary font-bold">{layerHeight} мм</span>
                  </div>
                  <select 
                    value={layerHeight} 
                    onChange={(e) => setLayerHeight(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-primary outline-none"
                  >
                    <option value={0.1}>0.1 мм (Высокое качество)</option>
                    <option value={0.2}>0.2 мм (Стандарт)</option>
                    <option value={0.3}>0.3 мм (Черновик)</option>
                  </select>
                </div>
              </div>
            )}
            
             <div className="space-y-3">
                <label className="text-sm font-medium text-gray-400">Количество копий</label>
                <div className="flex items-center gap-4">
                   <button 
                     onClick={() => setCount(Math.max(1, count - 1))}
                     className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white transition-colors"
                   >
                     -
                   </button>
                   <span className="text-xl font-bold text-white w-8 text-center">{count}</span>
                   <button 
                     onClick={() => setCount(count + 1)}
                     className="w-10 h-10 rounded-lg border border-slate-800 flex items-center justify-center hover:bg-slate-800 text-white transition-colors"
                   >
                     +
                   </button>
                </div>
             </div>

          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="neon-card p-6 rounded-2xl space-y-6">
            <h3 className="text-xl font-bold border-b border-slate-800 pb-4 text-white">Итоговый расчет</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Технология</span>
                <span className="font-medium text-gray-300">{TECHNOLOGIES.find(t => t.id === tech)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Материал</span>
                <span className="font-medium text-gray-300">{MATERIALS[tech as keyof typeof MATERIALS]?.find(m => m.id === material)?.name}</span>
              </div>
              {tech === "fdm" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Заполнение</span>
                    <span className="font-medium text-gray-300">{infill}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Слой</span>
                    <span className="font-medium text-gray-300">{layerHeight} мм</span>
                  </div>
                </>
              )}
               <div className="flex justify-between pt-2 border-t border-slate-900">
                 <span className="text-gray-500">Количество</span>
                 <span className="font-medium text-white">{count} шт.</span>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="flex justify-between items-end mb-2">
                <span className="text-gray-500">Цена</span>
                <span className="text-4xl font-bold text-primary text-glow">{calculatePrice()} ₽</span>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                * Предварительный расчет. Не является офертой.
              </p>
              
              <button className="w-full bg-primary hover:bg-orange-600 text-white py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(255,94,0,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,94,0,0.5)] hover:-translate-y-1 active:translate-y-0">
                Оформить заказ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
