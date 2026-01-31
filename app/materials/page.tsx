export default function MaterialsPage() {
  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 text-white">Материалы</h1>
      <div className="grid gap-8">
         <div className="space-y-4">
            <h2 className="text-2xl font-bold text-primary">Инженерные пластики (FDM)</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               <div className="neon-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-2 text-white">PLA</h3>
                  <p className="text-gray-400 text-sm mb-4">Полилактид. Экологичный, жесткий, но не термостойкий.</p>
                  <ul className="text-sm list-disc list-inside text-gray-400">
                     <li>Точность</li>
                     <li>Отсутствие усадки</li>
                     <li>Декор и прототипы</li>
                  </ul>
               </div>
               <div className="neon-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-2 text-white">PETG</h3>
                  <p className="text-gray-400 text-sm mb-4">Полиэтилентерефталат-гликоль. Баланс прочности и простоты.</p>
                  <ul className="text-sm list-disc list-inside text-gray-400">
                     <li>Химостойкость</li>
                     <li>Ударопрочность</li>
                     <li>Функциональные детали</li>
                  </ul>
               </div>
               <div className="neon-card p-6 rounded-xl">
                  <h3 className="text-xl font-bold mb-2 text-white">ABS/ASA</h3>
                  <p className="text-gray-400 text-sm mb-4">Ударопрочные технические пластики.</p>
                  <ul className="text-sm list-disc list-inside text-gray-400">
                     <li>Термостойкость до 100°C</li>
                     <li>Обрабатываемость</li>
                     <li>Корпуса и механизмы</li>
                  </ul>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
