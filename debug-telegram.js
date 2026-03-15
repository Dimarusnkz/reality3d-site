const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TELEGRAM_BOT_TOKEN = "8575014180:AAHVKypLQcCzj6NRTgY-uAqt6XPJreMENq8";

async function main() {
  console.log('Checking Telegram subscribers...');
  try {
    const subscribers = await prisma.telegramSubscriber.findMany();
    console.log('Subscribers found:', subscribers);

    if (subscribers.length === 0) {
      console.log('No subscribers in DB.');
    } else {
        console.log('Token:', TELEGRAM_BOT_TOKEN);
        
        for (const sub of subscribers) {
            console.log(`Sending to ${sub.chatId} (${sub.name})...`);
            try {
                const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: sub.chatId,
                        text: 'Debug message from server script',
                        parse_mode: 'HTML'
                    })
                });
                const text = await response.text();
                console.log(`Response for ${sub.chatId}:`, response.status, text);
            } catch (e) {
                console.error(`Error sending to ${sub.chatId}:`, e);
            }
        }
    }

  } catch (e) {
    console.error('Error querying DB:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
