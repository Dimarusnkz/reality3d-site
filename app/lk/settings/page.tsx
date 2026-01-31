"use client";

export default function LkSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Настройки профиля</h1>
      <div className="neon-card p-6 rounded-xl max-w-2xl">
        <form className="space-y-4">
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Имя</label>
              <input type="text" defaultValue="John Doe" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input type="email" defaultValue="client@example.com" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Телефон</label>
              <input type="tel" defaultValue="+7 (999) 123-45-67" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Адрес доставки</label>
              <input type="text" defaultValue="г. Москва, ул. Пушкина, д. 10" className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-white" />
           </div>
           <button type="button" className="neon-button">Сохранить</button>
        </form>
      </div>
    </div>
  );
}
