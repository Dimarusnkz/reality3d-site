import { getDocBySlug } from "@/lib/docs";
import { notFound } from "next/navigation";
import { DocEditor } from "./doc-editor";
import { getSession } from "@/lib/session";

export default async function EditDocPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return <div>Unauthorized</div>;
  }

  const { category, slug } = await params;
  const doc = await getDocBySlug(category, slug);

  if (!doc) {
    notFound();
  }

  return (
    <DocEditor
      category={category}
      slug={slug}
      initialContent={doc.content}
      initialMetadata={doc.metadata}
    />
  );
}
