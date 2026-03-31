import { getPrisma } from "@/lib/prisma";
import { KBEditor } from "../../kb-editor";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function EditKBArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') redirect('/admin');

  const { id } = await params;
  const prisma = getPrisma();
  
  const [article, categories] = await Promise.all([
    prisma.knowledgeBaseArticle.findUnique({
      where: { id: Number(id) }
    }),
    prisma.knowledgeBaseCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { sortOrder: 'asc' }
    })
  ]);

  if (!article) notFound();

  return (
    <KBEditor 
      initialData={article}
      categories={categories} 
      mode="edit" 
    />
  );
}
