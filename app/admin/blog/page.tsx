import { getArticles, deleteArticle } from "@/app/actions/blog";
import Link from "next/link";
import { Plus, Edit2, Trash2, Eye } from "lucide-react";
import BlogListClient from "./blog-list-client";

export default async function AdminBlogPage() {
  const articles = await getArticles(false); // Get all articles, including unpublished

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Управление блогом</h1>
        <Link 
          href="/admin/blog/new" 
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Новая статья
        </Link>
      </div>

      <BlogListClient initialArticles={articles} />
    </div>
  );
}
