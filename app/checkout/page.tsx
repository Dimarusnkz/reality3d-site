import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const prisma = getPrisma();
  const userId = parseInt(session.userId, 10);

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  const items =
    cart?.items
      .filter((i) => i.product && i.product.isActive)
      .map((i) => ({
        name: i.product!.name,
        quantity: i.quantity,
        unitPriceKopeks: i.product!.priceKopeks,
      })) || [];

  if (items.length === 0) redirect("/cart");

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">Оформление заказа</h1>
      <CheckoutClient items={items} />
    </div>
  );
}

