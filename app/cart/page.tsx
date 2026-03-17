import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { CartClient } from "./cart-client";

export default async function CartPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/login");

  const prisma = getPrisma();
  const userId = parseInt(session.userId, 10);

  const cart = await prisma.shopCart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const items =
    cart?.items
      .filter((i) => i.product && i.product.isActive)
      .map((i) => ({
        productId: i.productId,
        name: i.product!.name,
        slug: i.product!.slug,
        unitPriceKopeks: i.product!.priceKopeks,
        quantity: i.quantity,
        stock: i.product!.stock,
        imageUrl: i.product!.images[0]?.url || null,
      })) || [];

  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <h1 className="text-3xl font-bold text-white">Корзина</h1>
      <CartClient initialItems={items} />
    </div>
  );
}

