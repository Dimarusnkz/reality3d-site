import { Wrench, Printer, Box } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-white text-center">Наши услуги</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="neon-card p-6 rounded-xl flex flex-col items-center text-center">
          <Printer className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">3D Печать (FDM/SLA/SLS)</h2>
          <p className="text-gray-400">Изготовление деталей любой сложности из пластика, фотополимера и полиамида.</p>
        </div>
        <div className="neon-card p-6 rounded-xl flex flex-col items-center text-center">
          <Box className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">3D Моделирование</h2>
          <p className="text-gray-400">Разработка 3D-моделей по чертежам, эскизам или образцам.</p>
        </div>
        <div className="neon-card p-6 rounded-xl flex flex-col items-center text-center">
          <Wrench className="h-10 w-10 text-primary mb-4" />
          <h2 className="text-xl font-bold mb-2 text-white">Постобработка</h2>
          <p className="text-gray-400">Шлифовка, грунтовка, покраска и сборка готовых изделий.</p>
        </div>
      </div>
    </div>
  );
}
