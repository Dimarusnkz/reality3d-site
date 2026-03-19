import TelegramSettings from "../telegram/telegram-settings";
import MaxSettings from "../max/max-settings";

export default function AutomationPage() {
  const isBotTokenConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
  const isEnvChatIdConfigured = !!process.env.TELEGRAM_CHAT_ID;
  const isMaxConfigured = !!process.env.MAX_BOT_TOKEN;

  return (
    <div className="space-y-12 pb-20">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Автоматизация</h1>
        <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Notifications & Integration Settings</p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40">
          <TelegramSettings 
            isBotTokenConfigured={isBotTokenConfigured} 
            isEnvChatIdConfigured={isEnvChatIdConfigured} 
          />
        </div>

        <div className="neon-card p-8 rounded-[2.5rem] border border-slate-800 bg-slate-900/40">
          <MaxSettings isConfigured={isMaxConfigured} />
        </div>
      </div>
    </div>
  );
}
