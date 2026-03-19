import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import CheckoutClient from "./checkout-client";

export default async function CheckoutPage() {
  const session = await getSession();

  const prisma = getPrisma();
  const userId = session?.userId ? parseInt(session.userId, 10) : null;

  const [cart, user] = userId
    ? await Promise.all([
        prisma.shopCart.findUnique({
          where: { userId },
          include: { items: { include: { product: true } } },
        }),
        prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true, phone: true, address: true, city: true } }),
      ])
    : [null, null];

  const totalKopeks = cart?.items.reduce((acc, i) => acc + i.quantity * i.unitPriceKopeks, 0) || 0;
  const cartWithTotal = cart ? { ...cart, totalKopeks } : null;

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">Оформление заказа</h1>
      <CheckoutClient
        cart={cartWithTotal}
        user={user}
        isAuthenticated={Boolean(userId)}
      />
    </div>
  );
}
