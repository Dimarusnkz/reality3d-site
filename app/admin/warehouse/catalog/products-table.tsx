"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteShopProduct } from "@/app/actions/shop-admin";
import { Edit2, Trash2, Eye, CheckCircle, XCircle, Image } from "lucide-react";
import { formatRub } from "@/lib/shop/money";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function CatalogProductsTable({ initialProducts, warehouseId }: { initialProducts: any[]; warehouseId: number }) {
  const [products, setProducts] = useState(initialProducts);

  const remove = async (id: number) => {
    if (!confirm("Удалить товар?")) return;
    const res = await deleteShopProduct(id, getCsrfToken());
    if (!res.ok) {
      alert(res.error || "Ошибка при удалении");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="neon-card rounded-2xl overflow-hidden border border-slate-800/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-gray-500 bg-slate-950 border-b border-slate-800/50">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Товар</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Категория</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Цена</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Остатки</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px]">Статус</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-[10px] text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-primary/[0.02] transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow-inner group-hover:border-primary/30 transition-colors">
                      <img src={p.images?.[0]?.url || "/grid.svg"} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-base group-hover:text-primary transition-colors">{p.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-tight">/{p.slug}</div>
                      {p.sku ? <div className="text-[10px] text-primary/60 font-bold mt-1 uppercase tracking-widest">SKU: {p.sku}</div> : null}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-gray-300 font-medium">{p.category?.name || "—"}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="text-white font-bold">{formatRub(p.priceKopeks)}</div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest">
                      <span className="text-gray-500">Свободно:</span>
                      <span className={cn("text-white", p.stock > 0 ? "text-green-400" : "text-red-400")}>{p.stock}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest">
                      <span className="text-gray-500">Резерв:</span>
                      <span className="text-orange-400">{p.inventoryItems?.[0] ? Number(p.inventoryItems[0].reserved || 0) : 0}</span>
                    </div>
                    <div className="border-t border-slate-800/50 mt-1 pt-1 flex items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest">
                      <span className="text-gray-400">Всего:</span>
                      <span className="text-white">{p.inventoryItems?.[0] ? Number(p.inventoryItems[0].quantity || 0) : 0}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Badge variant={p.isActive ? "success" : "warning"}>
                    {p.isActive ? "Активен" : "Скрыт"}
                  </Badge>
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <LinkButton
                      href={`/shop/${p.slug}`}
                      target="_blank"
                      variant="secondary"
                      size="sm"
                      title="Просмотр"
                    >
                      <Eye className="w-4 h-4" />
                    </LinkButton>
                    <LinkButton
                      href={`/admin/shop/products/${p.id}`}
                      variant="secondary"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300"
                      title="Оформление карточки"
                    >
                      <Image className="w-4 h-4" />
                    </LinkButton>
                    <LinkButton
                      href={`/admin/warehouse/catalog/${p.id}?w=${warehouseId}`}
                      variant="secondary"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                      title="Редактировать параметры"
                    >
                      <Edit2 className="w-4 h-4" />
                    </LinkButton>
                    <Button
                      onClick={() => remove(p.id)}
                      variant="secondary"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500 font-medium">Каталог пуст</p>
        </div>
      ) : null}
    </div>
  );
}
