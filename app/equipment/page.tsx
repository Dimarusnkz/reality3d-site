export default function EquipmentPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-white">Оборудование</h1>
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 text-primary">FDM Принтеры</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="neon-card p-4 rounded-lg">
                <h3 className="font-bold text-white">Bambu Lab X1 Carbon</h3>
                <p className="text-sm text-gray-400">Высокоскоростная печать инженерными пластиками.</p>
             </div>
             <div className="neon-card p-4 rounded-lg">
                <h3 className="font-bold text-white">Picaso Designer X</h3>
                <p className="text-sm text-gray-400">Профессиональный принтер для тугоплавких материалов.</p>
             </div>
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4 text-secondary">SLA/LFS Принтеры</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             <div className="neon-card p-4 rounded-lg">
                <h3 className="font-bold text-white">Formlabs Form 3+</h3>
                <p className="text-sm text-gray-400">Высочайшая точность и гладкость поверхности.</p>
             </div>
             <div className="neon-card p-4 rounded-lg">
                <h3 className="font-bold text-white">Anycubic Photon Mono M5s</h3>
                <p className="text-sm text-gray-400">Печать крупных детализированных моделей (12K).</p>
             </div>
          </div>
        </section>
      </div>
    </div>
  );
}
