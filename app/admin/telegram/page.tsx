import TelegramSettings from "./telegram-settings";

export default function TelegramPage() {
  const isBotTokenConfigured = !!process.env.TELEGRAM_BOT_TOKEN;
  const isEnvChatIdConfigured = !!process.env.TELEGRAM_CHAT_ID;

  return (
    <div className="container mx-auto max-w-5xl">
       <TelegramSettings isBotTokenConfigured={isBotTokenConfigured} isEnvChatIdConfigured={isEnvChatIdConfigured} />
    </div>
  );
}
