import { getPrisma } from "@/lib/prisma";
import { KBEditor } from "../kb-editor";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function NewKBArticlePage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/admin');

  const prisma = getPrisma();
  const categories = await prisma.knowledgeBaseCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { sortOrder: 'asc' }
  });

  return (
    <KBEditor 
      categories={categories} 
      mode="create" 
    />
  );
}
