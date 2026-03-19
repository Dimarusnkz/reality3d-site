import { getArticles } from "@/app/actions/blog";
import { Plus, FileText } from "lucide-react";
import BlogListClient from "./blog-list-client";
import { LinkButton } from "@/components/ui/button";

export default async function AdminBlogPage() {
  const articles = await getArticles(false); // Get all articles, including unpublished

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Управление блогом</h1>
          <p className="text-gray-500 mt-1 font-bold uppercase tracking-widest text-[10px]">Content & Article Management</p>
        </div>
        <LinkButton 
          href="/admin/blog/new" 
          variant="primary"
          size="sm"
          className="font-bold uppercase tracking-widest text-[10px]"
        >
          <Plus className="mr-2 h-3.5 w-3.5" />
          Новая статья
        </LinkButton>
      </div>

      <BlogListClient initialArticles={articles} />
    </div>
  );
}
