import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MAX_BOT_TOKEN = process.env.MAX_BOT_TOKEN;

// Base URL for MAX Platform API
const MAX_API_URL = 'https://platform-api.max.ru';

export async function verifyMaxToken() {
  if (!MAX_BOT_TOKEN) return false;
  
  try {
    const response = await fetch(`${MAX_API_URL}/me`, {
      method: 'GET',
      headers: {
        'Authorization': MAX_BOT_TOKEN,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('MAX Bot verified:', data);
      return true;
    } else {
      console.error('MAX Bot verification failed:', await response.text());
      return false;
    }
  } catch (error) {
    console.error('Error verifying MAX token:', error);
    return false;
  }
}

export async function sendMaxMessage(message: string) {
  if (!MAX_BOT_TOKEN) {
    console.warn('MAX bot token not set');
    return false;
  }

  try {
    const subscribers = await prisma.maxSubscriber.findMany();
    
    if (subscribers.length === 0) {
      console.warn('No MAX recipients found');
      return false;
    }

    const results = await Promise.all(subscribers.map(async (sub) => {
      // Try both number and string formats for ID
      const userId = parseInt(sub.chatId);
      const idToUse = !isNaN(userId) ? userId : sub.chatId;

      // Standard payload structure based on documentation hints
      const payload = {
        chat_id: idToUse, // Most common field name
        message: {
           text: message
        }
      };

      const response = await fetch(`${MAX_API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': MAX_BOT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to send MAX message to ${sub.chatId}. Response:`, errorText);
        
        // Retry with user_id if failed
        if (errorText.includes("proto.payload")) {
             console.log("Retrying with 'user_id'...");
             const altPayload = {
                user_id: idToUse,
                message: { text: message }
             };
             const res2 = await fetch(`${MAX_API_URL}/messages`, {
                method: 'POST',
                headers: { 'Authorization': MAX_BOT_TOKEN, 'Content-Type': 'application/json' },
                body: JSON.stringify(altPayload)
             });
             if (!res2.ok) {
                 console.log("Retry failed:", await res2.text());
             }
        }
        return false;
      }
      return true;
    }));

    return results.some(result => result);
  } catch (error) {
    console.error('Error sending MAX message:', error);
    return false;
  }
}
