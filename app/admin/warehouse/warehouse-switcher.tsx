"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function WarehouseSwitcher({ warehouses, currentId }: { warehouses: { id: number; name: string }[]; currentId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  return (
    <select
      value={String(currentId)}
      onChange={(e) => {
        const next = new URLSearchParams(sp.toString());
        next.set("w", e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
    >
      {warehouses.map((w) => (
        <option key={w.id} value={String(w.id)}>
          {w.name}
        </option>
      ))}
    </select>
  );
}

