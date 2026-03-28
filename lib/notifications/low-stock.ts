
import { getPrisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';
import { sendMaxMessage } from '@/lib/max';

export async function checkAndNotifyLowStock(productId?: number) {
  const prisma = getPrisma();

  // 1. Fetch items with threshold set
  const inventoryItems = await prisma.shopInventoryItem.findMany({
    where: {
      productId: productId,
      minThreshold: { gt: 0 }
    },
    include: {
      product: {
        select: {
          name: true,
          sku: true
        }
      },
      warehouse: {
        select: {
          name: true
        }
      }
    }
  });

  if (inventoryItems.length === 0) return { ok: true, notified: 0 };

  let notifiedCount = 0;
  for (const item of inventoryItems) {
    const qty = Number(item.quantity);
    const reserved = Number((item as any).reserved ?? 0);
    const available = qty - reserved;
    const threshold = Number(item.minThreshold);
    
    // Notify if available quantity is below or equal to threshold
    if (available <= threshold) {
      const message = 
        `<b>⚠️ НИЗКИЙ ОСТАТОК ТОВАРА</b>\n\n` +
        `📦 Товар: <b>${item.product.name}</b>\n` +
        `🆔 SKU: <code>${item.product.sku || '—'}</code>\n` +
        `🏢 Склад: ${item.warehouse.name}\n` +
        `📉 Доступно: <b>${available} ${item.unit}</b> (Всего: ${qty}, Резерв: ${reserved})\n` +
        `🛑 Порог уведомления: ${threshold} ${item.unit}\n\n` +
        `<a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/warehouse/catalog/${item.productId}">Перейти к товару</a>`;

      await Promise.all([
        sendTelegramMessage(message),
        sendMaxMessage(message, { format: 'html' })
      ]).catch(err => console.error('Low stock notification failed:', err));

      notifiedCount++;
    }
  }

  return { ok: true, notified: notifiedCount };
}
