import { Badge } from "@/components/ui/badge";
import { Boxes, Zap, Shield, Microscope, Layers, Wind, Droplets } from "lucide-react";

const MATERIAL_GROUPS = [
  {
    title: "Инженерные пластики (FDM)",
    subtitle: "Industrial FDM Polymers",
    icon: Boxes,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/20",
    materials: [
      {
        name: "PLA",
        description: "Полилактид. Экологичный, жесткий, идеален для детализированных моделей без усадки.",
        features: ["Высокая точность", "Отсутствие запаха", "Биоразлагаемый"],
        applications: ["Прототипы", "Декор", "Архитектура"]
      },
      {
        name: "PETG",
        description: "Полиэтилентерефталат-гликоль. Баланс прочности, гибкости и химической стойкости.",
        features: ["Ударопрочность", "Химостойкость", "Простота печати"],
        applications: ["Механизмы", "Корпуса", "Крепления"]
      },
      {
        name: "ABS / ASA",
        description: "Технические пластики для уличного и промышленного применения. Стойкие к UV и температуре.",
        features: ["Термостойкость 100°C", "Пост-обработка", "Долговечность"],
        applications: ["Авто-детали", "Уличные изделия", "Техника"]
      }
    ]
  },
  {
    title: "Высокопрочные материалы",
    subtitle: "High-Performance Polymers",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    materials: [
      {
        name: "Nylon (PA12)",
        description: "Полиамид. Чрезвычайно прочный и износостойкий материал с низким коэффициентом трения.",
        features: ["Износостойкость", "Гибкость", "Прочность"],
        applications: ["Шестерни", "Подшипники", "Шарниры"]
      },
      {
        name: "Carbon Filled",
        description: "Композиты с углеволокном. Максимальная жесткость и стабильность размеров.",
        features: ["Сверхжесткость", "Легкость", "Матовый финиш"],
        applications: ["Дроны", "Спорт-инвентарь", "Аэрокосмика"]
      },
      {
        name: "TPU / Flex",
        description: "Термопластичный полиуретан. Резиноподобный гибкий материал с высокой эластичностью.",
        features: ["Эластичность", "Гашение вибраций", "Маслостойкость"],
        applications: ["Уплотнители", "Чехлы", "Демпферы"]
      }
    ]
  },
  {
    title: "Фотополимерные смолы (SLA)",
    subtitle: "Precision SLA Resins",
    icon: Microscope,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    materials: [
      {
        name: "Standard Resin",
        description: "Идеальная гладкость поверхности и микроскопическая детализация.",
        features: ["Гладкость", "Детализация 0.02мм", "Изотропность"],
        applications: ["Миниатюры", "Ювелирные формы", "Стоматология"]
      },
      {
        name: "Tough / Durable",
        description: "Смолы, имитирующие свойства ABS или полипропилена по прочности.",
        features: ["Функциональность", "Ударопрочность", "Упругость"],
        applications: ["Защелки", "Прототипы сборки", "Мастер-модели"]
      }
    ]
  }
];

export default function MaterialsPage() {
  return (
    <div className="container mx-auto py-16 px-4 md:px-6 max-w-7xl">
      <div className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase">Материалы</h1>
        <p className="text-gray-500 max-w-2xl mx-auto font-bold uppercase tracking-widest text-[10px]">
          Comprehensive guide to 3D printing polymers and resins
        </p>
      </div>

      <div className="space-y-24">
        {MATERIAL_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-10">
            <div className="flex items-center gap-6">
              <div className={`w-14 h-14 rounded-2xl ${group.bgColor} flex items-center justify-center border ${group.borderColor} shadow-inner`}>
                <group.icon className={`w-7 h-7 ${group.color}`} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">{group.title}</h2>
                <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px] mt-1">{group.subtitle}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {group.materials.map((mat, mIdx) => (
                <div key={mIdx} className="group relative neon-card border border-slate-800 bg-slate-900/40 p-8 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all duration-500 hover:shadow-[0_0_50px_rgba(255,255,255,0.02)] flex flex-col">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none">
                    <group.icon className="w-24 h-24 text-white" />
                  </div>
                  
                  <div className="relative z-10 flex-1">
                    <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-primary transition-colors uppercase">{mat.name}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-8">{mat.description}</p>
                    
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Zap className="w-3 h-3 text-yellow-500/60" /> Особенности
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {mat.features.map((f, fIdx) => (
                            <span key={fIdx} className="px-3 py-1 bg-slate-950/50 border border-slate-800 rounded-lg text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em] flex items-center gap-2">
                          <Layers className="w-3 h-3 text-blue-500/60" /> Применение
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {mat.applications.map((a, aIdx) => (
                            <span key={aIdx} className="px-3 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Block */}
      <div className="mt-32 p-12 rounded-[3rem] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center text-center lg:text-left">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-tight">Не знаете какой<br /><span className="text-primary">материал выбрать?</span></h2>
            <p className="text-gray-500 text-sm leading-relaxed max-w-md mx-auto lg:mx-0 font-medium">
              Наши специалисты подберут оптимальный пластик или смолу под ваши задачи, учитывая прочность, температуру и бюджет.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
            <button className="px-10 py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
              Получить консультацию
            </button>
            <button className="px-10 py-5 bg-slate-950 border border-slate-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all duration-300">
              Заказать образцы
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
