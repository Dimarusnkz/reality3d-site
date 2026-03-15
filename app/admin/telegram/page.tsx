import TelegramSettings from "./telegram-settings";

export default function TelegramPage() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "Not Set";
  const envChatId = process.env.TELEGRAM_CHAT_ID || "Not Set";

  return (
    <div className="container mx-auto max-w-5xl">
       <TelegramSettings botToken={botToken} envChatId={envChatId} />
    </div>
  );
}
