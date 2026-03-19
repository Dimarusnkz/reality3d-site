"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { 
  Upload, 
  FileBox, 
  Check, 
  Zap, 
  Layers, 
  Cpu, 
  Info, 
  HelpCircle,
  Clock,
  Truck,
  MessageSquare,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return '';
  return parts.pop()?.split(';').shift() || '';
}

const TECHNOLOGIES = [
  { id: "fdm", name: "FDM", icon: Cpu, desc: "Пластиковая нить. Дешево и прочно.", longDesc: "FDM (Fused Deposition Modeling) — самая популярная технология. Подходит для функциональных деталей, корпусов и крупных объектов. Видна слоистость поверхности." },
  { id: "sla", name: "SLA", icon: Zap, desc: "Смола. Высокая точность.", longDesc: "SLA (Stereolithography) — печать фотополимерной смолой. Обеспечивает идеальную гладкость и детализацию. Подходит для миниатюр, ювелирных изделий и мастер-моделей." },
  { id: "sls", name: "SLS", icon: Layers, desc: "Порошок. Промышленное качество.", longDesc: "SLS (Selective Laser Sintering) — спекание нейлонового порошка лазером. Не требует поддержек, позволяет создавать сложнейшую геометрию. Детали прочные и функциональные." },
];

const MATERIALS = {
  fdm: [
    { id: "pla", name: "PLA", price: 10, desc: "Для декора" },
    { id: "abs", name: "ABS", price: 12, desc: "Технический" },
    { id: "petg", name: "PETG", price: 11, desc: "Универсальный" },
  ],
  sla: [
    { id: "standard", name: "Standard", price: 25, desc: "Гладкий" },
    { id: "tough", name: "Tough", price: 35, desc: "Прочный" },
  ],
  sls: [
    { id: "pa12", name: "PA12", price: 40, desc: "Нейлон" },
  ],
};

export default function CalculatorPage() {
  const router = useRouter();
  const [isOrdering, setIsOrdering] = useState(false);
  const [mode, setMode] = useState<"file" | "manual">("file");
  const [file, setFile] = useState<File | null>(null);
  const [tech, setTech] = useState("fdm");
  const [material, setMaterial] = useState("pla");
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [count, setCount] = useState(1);
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const [manualParams, setManualParams] = useState({
    weight: 0,
    time: 0,
  });

  const priceRange = useMemo(() => {
    let min = 500;
    let max = 700;

    if (mode === "manual") {
      const weightPrice = manualParams.weight * 15;
      const timePrice = manualParams.time * 100;
      min = 500 + weightPrice + timePrice;
      max = min * 1.2;
    } else if (file) {
      min = 500 + (file.size / 5000);
      max = min * 1.5;
    }

    const matPrice = MATERIALS[tech as keyof typeof MATERIALS]?.find(m => m.id === material)?.price || 10;
    min += (matPrice * 5);
    max += (matPrice * 15);

    return { 
      min: Math.round(min * count), 
      max: Math.round(max * count) 
    };
  }, [mode, manualParams, file, tech, material, count]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    const details = {
      mode,
      tech,
      material,
      infill: tech === 'fdm' ? infill : undefined,
      layerHeight: tech === 'fdm' ? layerHeight : undefined,
      count,
      fileName: file?.name,
      fileSize: file?.size,
      manualParams: mode === 'manual' ? manualParams : undefined
    };

    try {
        const result = await createOrder({ 
            title: `Заказ: ${mode === 'file' ? file?.name || 'Новая модель' : 'По параметрам'}`,
            price: priceRange.min, 
            details,
            csrfToken: getCsrfToken(),
        });

        if (result.error === 'Unauthorized') {
          router.push('/login?redirectTo=/calculator');
        } else if (result.success) {
          router.push('/lk/orders');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsOrdering(false);
    }
  };

  const tips = [
    { id: 'tech', label: 'Что выбрать?', content: 'Для прототипов выбирайте FDM. Для фигурок и высокой точности — SLA. Для нагруженных деталей — SLS.' },
    { id: 'mat', label: 'Материал?', content: 'PLA самый простой и дешевый. PETG более прочный. ABS держит температуру до 100°C.' },
    { id: 'price', label: 'От чего цена?', content: 'Цена зависит от объема модели, времени печати и выбранного материала. Точный расчет сделает менеджер.' }
  ];

  return (
    <div className="container mx-auto py-12 px-4 md:px-6 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <Badge variant="secondary" className="mb-2">Reality3D Calc</Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">Калькулятор печати</h1>
          <p className="text-gray-400 mt-2 text-lg">Загрузите модель для мгновенной оценки стоимости</p>
        </div>
        
        {/* Мини-онбординг */}
        <div className="flex gap-2">
          {tips.map(tip => (
            <div key={tip.id} className="relative">
              <button
                onClick={() => setActiveTip(activeTip === tip.id ? null : tip.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                  activeTip === tip.id 
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "bg-slate-900 text-gray-400 border-slate-800 hover:border-slate-700"
                )}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                {tip.label}
              </button>
              {activeTip === tip.id && (
                <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-gray-200 leading-relaxed">{tip.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-10">
          {/* Mode Switcher */}
          <div className="flex p-1.5 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
            <button
              onClick={() => setMode("file")}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all",
                mode === "file" ? "bg-slate-800 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Upload className="h-4 w-4" />
              Файл модели
            </button>
            <button
              onClick={() => setMode("manual")}
              className={cn(
                "flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold transition-all",
                mode === "manual" ? "bg-slate-800 text-white shadow-xl" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Plus className="h-4 w-4" />
              Параметры
            </button>
          </div>

          {mode === "file" ? (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-orange-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative border-2 border-dashed border-slate-800 rounded-3xl p-16 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-all cursor-pointer bg-slate-900/40 backdrop-blur-sm">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".stl,.obj,.step,.stp"
                  onChange={handleFileChange}
                />
                {file ? (
                  <>
                    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 border border-primary/20">
                      <FileBox className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-xl font-bold text-white">{file.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button className="mt-6 text-sm font-bold text-red-500 hover:text-red-400 transition-colors z-10 flex items-center gap-2" onClick={(e) => { e.preventDefault(); setFile(null); }}>
                      Заменить файл
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6 border border-slate-700 group-hover:scale-110 transition-all duration-500">
                       <Upload className="h-10 w-10 text-gray-400 group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-xl font-bold text-white">Перетащите модель</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-[240px]">STL, OBJ, STEP, STP файлы до 100 МБ</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl">
               <div className="space-y-3">
                 <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Приблизительный вес (г)</label>
                 <input 
                   type="number" 
                   className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-primary outline-none transition-all text-lg font-bold" 
                   placeholder="0"
                   value={manualParams.weight || ""}
                   onChange={(e) => setManualParams({...manualParams, weight: Number(e.target.value)})}
                 />
               </div>
               <div className="space-y-3">
                 <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Время печати (ч)</label>
                 <input 
                   type="number" 
                   className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-primary outline-none transition-all text-lg font-bold"
                   placeholder="0"
                   value={manualParams.time || ""}
                   onChange={(e) => setManualParams({...manualParams, time: Number(e.target.value)})}
                 />
               </div>
            </div>
          )}

          {/* Settings */}
          <div className="space-y-10">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cpu className="h-4 w-4 text-primary" />
                </div>
                Технология печати
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {TECHNOLOGIES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTech(t.id); setMaterial(MATERIALS[t.id as keyof typeof MATERIALS][0].id); }}
                    className={cn(
                      "p-6 rounded-2xl border text-left transition-all relative overflow-hidden group/btn",
                      tech === t.id 
                        ? "border-primary bg-primary/5 shadow-lg shadow-primary/5" 
                        : "border-slate-800 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-900/50"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-3">
                       <t.icon className={cn("w-6 h-6 transition-colors", tech === t.id ? "text-primary" : "text-gray-500 group-hover/btn:text-gray-300")} />
                       <span className={cn("font-bold text-lg", tech === t.id ? "text-white" : "text-gray-400 group-hover/btn:text-gray-200")}>{t.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 leading-relaxed">{t.desc}</div>
                    {tech === t.id && <div className="absolute top-2 right-2"><Check className="h-4 w-4 text-primary" /></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-blue-400" />
                </div>
                Материал
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                 {MATERIALS[tech as keyof typeof MATERIALS]?.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMaterial(m.id)}
                      className={cn(
                        "p-5 rounded-2xl border text-left transition-all relative group/mat",
                        material === m.id 
                          ? "border-blue-500/50 bg-blue-500/5 shadow-lg shadow-blue-500/5" 
                          : "border-slate-800 bg-slate-900/30 hover:border-slate-600"
                      )}
                    >
                      <div className="font-bold text-white mb-1 group-hover/mat:text-blue-400 transition-colors">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.desc}</div>
                      {material === m.id && <div className="absolute top-2 right-2"><Check className="h-4 w-4 text-blue-400" /></div>}
                    </button>
                 ))}
              </div>
            </div>
          </div>
        </div>

        {/* Результат (Card) */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="neon-card p-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <h3 className="text-lg font-bold text-gray-400 uppercase tracking-widest mb-6">Предварительный расчет</h3>
            
            <div className="space-y-6">
              <div className="flex items-end gap-2">
                <div className="text-5xl font-extrabold text-white tracking-tighter">
                  {priceRange.min.toLocaleString()}
                </div>
                <div className="text-2xl font-bold text-gray-500 mb-1.5">—</div>
                <div className="text-4xl font-bold text-white tracking-tighter mb-0.5">
                  {priceRange.max.toLocaleString()}
                </div>
                <div className="text-2xl font-bold text-primary mb-1.5 ml-1">₽</div>
              </div>
              
              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><Clock className="h-4 w-4" /> Срок печати</span>
                  <span className="text-white font-bold">от 1 дня</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><Truck className="h-4 w-4" /> Доставка</span>
                  <span className="text-white font-bold">от 350 ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Точность</span>
                  <span className="text-white font-bold">{tech === 'sla' ? '25' : '100'} мкм</span>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <Button 
                  onClick={handleOrder} 
                  disabled={isOrdering || (mode === 'file' && !file)}
                  className="w-full h-14 rounded-2xl text-lg shadow-xl shadow-primary/20"
                >
                  {isOrdering ? "Создание..." : "Создать заказ"}
                </Button>
                <LinkButton 
                  href="/contacts" 
                  variant="outline" 
                  className="w-full h-14 rounded-2xl border-slate-800"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Задать вопрос
                </LinkButton>
              </div>

              <p className="text-[10px] text-gray-600 text-center leading-relaxed">
                * Окончательная стоимость и сроки будут подтверждены менеджером после проверки файлов.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-6 rounded-2xl bg-slate-900/30 border border-slate-800/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <Info className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Не уверены в выборе параметров? Оформите заказ с текущими настройками, и наш инженер подскажет оптимальный вариант.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
