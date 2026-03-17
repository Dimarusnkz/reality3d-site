import { redirect } from "next/navigation";

export default async function NewShopProductPage() {
  redirect("/admin/warehouse/catalog/new");
}
