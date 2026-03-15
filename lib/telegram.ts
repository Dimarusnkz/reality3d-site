
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function sendTelegramMessage(message: string) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram bot token not set');
    return false;
  }

  try {
    // Получаем список подписчиков из базы данных
    const subscribers = await prisma.telegramSubscriber.findMany();
    
    // Если в базе нет подписчиков, используем .env как запасной вариант (для обратной совместимости)
    let chatIds: string[] = [];
    if (subscribers.length > 0) {
      chatIds = subscribers.map(sub => sub.chatId);
    } else if (process.env.TELEGRAM_CHAT_ID) {
      chatIds = process.env.TELEGRAM_CHAT_ID.split(',').map(id => id.trim()).filter(id => id);
    }

    if (chatIds.length === 0) {
      console.warn('No Telegram recipients found');
      return false;
    }

    const results = await Promise.all(chatIds.map(async (chatId) => {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send Telegram message to ${chatId}:`, await response.text());
        return false;
      }
      return true;
    }));

    return results.some(result => result);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}
