import AdminChatClient from "./chat-admin-client";

export default function AdminChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Центр сообщений</h1>
        <p className="text-gray-400">Общение с клиентами и командой</p>
      </div>
      <AdminChatClient />
    </div>
  );
}
