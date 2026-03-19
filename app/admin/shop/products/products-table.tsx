"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteShopProduct } from "@/app/actions/shop-admin";
import { Edit2, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function ShopProductsTable({ initialProducts }: { initialProducts: any[] }) {
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
                      <div className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-2">
                        {p.weightGrams != null ? <span className="bg-slate-800 px-1.5 py-0.5 rounded">{(p.weightGrams / 1000).toFixed(2)} кг</span> : null}
                        {p.lengthMm != null && p.widthMm != null && p.heightMm != null ? (
                          <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                            {Math.round(p.lengthMm / 10) / 10}×{Math.round(p.widthMm / 10) / 10}×{Math.round(p.heightMm / 10) / 10} см
                          </span>
                        ) : null}
                      </div>
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
                      title="Просмотр на сайте"
                    >
                      <Eye className="w-4 h-4" />
                    </LinkButton>
                    <LinkButton
                      href={`/admin/shop/products/${p.id}`}
                      variant="secondary"
                      size="sm"
                      className="text-blue-400 hover:text-blue-300"
                      title="Оформление карточки"
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
          <p className="text-gray-500 font-medium">Нет товаров в магазине</p>
        </div>
      ) : null}
    </div>
  );
}
