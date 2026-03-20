"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Send, Activity, Webhook } from "lucide-react";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

type Subscriber = {
  id: number;
  chatId: string;
  name: string | null;
  createdAt: Date;
};

interface TelegramSettingsProps {
  isBotTokenConfigured: boolean;
  isEnvChatIdConfigured: boolean;
}

export default function TelegramSettings({ isBotTokenConfigured, isEnvChatIdConfigured }: TelegramSettingsProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newChatId, setNewChatId] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const fetchSubscribers = async () => {
    const res = await fetch("/api/admin/integrations/telegram/subscribers", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as any;
    setSubscribers(Array.isArray(json?.subscribers) ? json.subscribers : []);
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleSetWebhook = async () => {
    setWebhookLoading(true);
    const res = await fetch("/api/admin/integrations/telegram/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      alert("Webhook установлен успешно: " + result?.message);
    } else {
      alert(result?.error || "Ошибка при установке Webhook");
    }
    setWebhookLoading(false);
  };

  const handleAdd = async () => {
    if (!newChatId) return;
    setLoading(true);
    const res = await fetch("/api/admin/integrations/telegram/subscribers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: newChatId, name: newName, csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      setNewChatId("");
      setNewName("");
      fetchSubscribers();
    } else {
      alert(result?.error || "Ошибка");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить этого получателя?")) return;
    const res = await fetch("/api/admin/integrations/telegram/subscribers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      fetchSubscribers();
    } else {
      alert(result?.error || "Ошибка");
    }
  };

  const handleTestBot = async () => {
    setTestLoading(true);
    const res = await fetch("/api/admin/integrations/telegram/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      alert("Тестовое сообщение отправлено успешно!");
    } else {
      alert(result?.error || "Ошибка отправки сообщения");
    }
    setTestLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Настройки Telegram</h2>
          <p className="text-gray-400">Управление получателями уведомлений о новых заказах</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSetWebhook}
            disabled={webhookLoading}
            className="neon-button flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Включить интерактивные кнопки (Confirm Payment)"
          >
            <Webhook className="h-4 w-4" />
            {webhookLoading ? '...' : 'Set Webhook'}
          </button>
          <button
            onClick={handleTestBot}
            disabled={testLoading}
            className="neon-button flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className="h-4 w-4" />
            {testLoading ? 'Отправка...' : 'Test_bot_TG'}
          </button>
        </div>
      </div>

      {/* Add New Subscriber */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-lg font-bold text-white">Добавить получателя</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Chat ID (например: 123456789)"
            value={newChatId}
            onChange={(e) => setNewChatId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
          <input
            type="text"
            placeholder="Имя (опционально)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !newChatId}
            className="neon-button flex items-center justify-center gap-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>
        <p className="text-xs text-gray-500">
          * Чтобы узнать Chat ID, напишите боту <a href="https://t.me/userinfobot" target="_blank" className="text-primary hover:underline">@userinfobot</a>
        </p>
      </div>

      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-lg font-bold text-white">Список получателей</h3>
        <div className="space-y-2">
          {subscribers.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-primary">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-white">{sub.name || 'Без имени'}</div>
                  <div className="text-sm text-slate-400">ID: {sub.chatId}</div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(sub.id)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                title="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {subscribers.length === 0 && (
            <div className="text-center text-slate-500 py-8">
              Список получателей пуст
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded-xl border border-yellow-800 bg-yellow-900/10 space-y-2">
        <h3 className="text-lg font-bold text-yellow-500">Debug Info (Server Env)</h3>
        <div className="space-y-1">
          <p className="text-gray-300 break-all">
            <span className="text-gray-500">Bot Token:</span>{' '}
            <code className="bg-black/50 px-2 py-1 rounded text-sm">{isBotTokenConfigured ? 'Задан' : 'Не задан'}</code>
          </p>
          <p className="text-gray-300 break-all">
            <span className="text-gray-500">Env Chat ID:</span>{' '}
            <code className="bg-black/50 px-2 py-1 rounded text-sm">{isEnvChatIdConfigured ? 'Задан' : 'Не задан'}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
