"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteShopProduct } from "@/app/actions/shop-admin";
import { Edit2, Trash2, Eye, CheckCircle, XCircle, Image } from "lucide-react";
import { formatRub } from "@/lib/shop/money";

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrf_token=`);
  if (parts.length !== 2) return "";
  return parts.pop()?.split(";").shift() || "";
}

export default function CatalogProductsTable({ initialProducts }: { initialProducts: any[] }) {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-slate-950 border-b border-slate-800">
          <tr>
            <th className="text-left p-4 text-gray-400 font-medium">Товар</th>
            <th className="text-left p-4 text-gray-400 font-medium">Категория</th>
            <th className="text-left p-4 text-gray-400 font-medium">Цена</th>
            <th className="text-left p-4 text-gray-400 font-medium">Остаток</th>
            <th className="text-left p-4 text-gray-400 font-medium">Статус</th>
            <th className="text-right p-4 text-gray-400 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
              <td className="p-4 text-white font-medium">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    <img src={p.images?.[0]?.url || "/grid.svg"} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">/{p.slug}</div>
                    {p.sku ? <div className="text-xs text-gray-500 mt-0.5">SKU: {p.sku}</div> : null}
                  </div>
                </div>
              </td>
              <td className="p-4 text-gray-300">{p.category?.name || "—"}</td>
              <td className="p-4 text-gray-300">{formatRub(p.priceKopeks)}</td>
              <td className="p-4 text-gray-300">{p.stock}</td>
              <td className="p-4">
                {p.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs">
                    <CheckCircle className="w-3 h-3" /> Активен
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-xs">
                    <XCircle className="w-3 h-3" /> Скрыт
                  </span>
                )}
              </td>
              <td className="p-4 text-right space-x-2">
                <Link
                  href={`/shop/${p.slug}`}
                  target="_blank"
                  className="inline-flex p-2 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Просмотр"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <Link
                  href={`/admin/shop/products/${p.id}`}
                  className="inline-flex p-2 text-purple-300 hover:text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg transition-colors"
                  title="Оформление карточки"
                >
                  <Image className="w-4 h-4" />
                </Link>
                <Link
                  href={`/admin/warehouse/catalog/${p.id}`}
                  className="inline-flex p-2 text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="inline-flex p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {products.length === 0 ? <div className="p-8 text-center text-gray-500">Нет товаров</div> : null}
    </div>
  );
}

