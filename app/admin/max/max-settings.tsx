"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Send, Activity, Box, Webhook } from "lucide-react";

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

interface MaxSettingsProps {
  isConfigured: boolean;
}

export default function MaxSettings({ isConfigured }: MaxSettingsProps) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [newChatId, setNewChatId] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);

  const fetchSubscribers = async () => {
    const res = await fetch("/api/admin/integrations/max/subscribers", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as any;
    setSubscribers(Array.isArray(json?.subscribers) ? json.subscribers : []);
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const handleAdd = async () => {
    if (!newChatId) return;
    setLoading(true);
    const res = await fetch("/api/admin/integrations/max/subscribers", {
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
    const res = await fetch("/api/admin/integrations/max/subscribers", {
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
    const res = await fetch("/api/admin/integrations/max/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      alert("MAX Bot успешно протестирован!");
    } else {
      alert(result?.error || "Ошибка тестирования бота");
    }
    setTestLoading(false);
  };

  const handleSetWebhook = async () => {
    setWebhookLoading(true);
    const res = await fetch("/api/admin/integrations/max/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken: getCsrfToken() }),
    });
    const result = (await res.json().catch(() => null)) as any;
    if (res.ok && result?.ok) {
      alert("Webhook установлен успешно: " + (result?.message || "OK"));
    } else {
      alert(result?.error || "Ошибка при установке Webhook");
    }
    setWebhookLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Box className="h-6 w-6 text-purple-500" />
            Настройки MAX Messenger
          </h2>
          <p className="text-gray-400">Управление получателями уведомлений через MAX</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSetWebhook}
            disabled={webhookLoading}
            className="neon-button flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Включить получение событий и callback-кнопок (Webhook)"
          >
            <Webhook className="h-4 w-4" />
            {webhookLoading ? "..." : "Set Webhook"}
          </button>
          <button
            onClick={handleTestBot}
            disabled={testLoading}
            className="neon-button flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className="h-4 w-4" />
            {testLoading ? "Проверка..." : "Test_bot_MAX"}
          </button>
        </div>
      </div>

      {/* Add New Subscriber */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
        <h3 className="text-lg font-bold text-white">Добавить получателя</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="MAX Chat ID"
            value={newChatId}
            onChange={(e) => setNewChatId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <input
            type="text"
            placeholder="Имя (опционально)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleAdd}
            disabled={loading || !newChatId}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Activity className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Добавить
          </button>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white">Список получателей</h3>
        {subscribers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-slate-900/30 rounded-xl border border-slate-800/50">
            Нет добавленных получателей
          </div>
        ) : (
          <div className="grid gap-4">
            {subscribers.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-purple-500/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">{sub.name || 'Без имени'}</div>
                    <div className="text-sm text-gray-400 font-mono">{sub.chatId}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(sub.id)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 text-sm text-gray-400">
        <h4 className="font-bold text-white mb-2 flex items-center gap-2">
          <Activity className="h-4 w-4 text-purple-500" />
          Информация о боте
        </h4>
        <p className="mb-2">
          Токен бота: <span className="font-mono bg-slate-950 px-2 py-1 rounded text-purple-300">{isConfigured ? 'Задан' : 'Не задан'}</span>
        </p>
        <p>
          Для получения Chat ID, напишите боту команду <code>/start</code> или посмотрите в документации MAX API.
        </p>
      </div>
    </div>
  );
}
