import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { getPrisma } from './prisma';

const DOCS_PATH = path.join(process.cwd(), 'content/docs');

export interface DocMetadata {
  title: string;
  description?: string;
  category: string;
  lastUpdated: string;
  slug: string;
  id?: number;
  isDb?: boolean;
}

export async function getDocBySlug(category: string, slug: string) {
  // 1. Try DB first
  const prisma = getPrisma();
  const dbArticle = await prisma.knowledgeBaseArticle.findUnique({
    where: { slug },
    include: { category: true }
  });

  if (dbArticle && dbArticle.category.slug === category) {
    return {
      metadata: {
        title: dbArticle.title,
        description: dbArticle.excerpt || undefined,
        category: dbArticle.category.slug,
        lastUpdated: dbArticle.updatedAt.toISOString(),
        slug: dbArticle.slug,
        id: dbArticle.id,
        isDb: true
      } as DocMetadata,
      content: dbArticle.content
    };
  }

  // 2. Fallback to Files
  try {
    const filePath = path.join(DOCS_PATH, category, `${slug}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    return {
      metadata: { ...data, slug, category, isDb: false } as DocMetadata,
      content
    };
  } catch (e) {
    return null;
  }
}

export async function getAllDocs(categorySlug?: string): Promise<DocMetadata[]> {
  const allDocs: DocMetadata[] = [];

  // 1. Load from DB
  const prisma = getPrisma();
  const dbArticles = await prisma.knowledgeBaseArticle.findMany({
    where: categorySlug ? { category: { slug: categorySlug } } : {},
    include: { category: true },
    orderBy: { sortOrder: 'asc' }
  });

  dbArticles.forEach(art => {
    allDocs.push({
      title: art.title,
      description: art.excerpt || undefined,
      category: art.category.slug,
      lastUpdated: art.updatedAt.toISOString(),
      slug: art.slug,
      id: art.id,
      isDb: true
    });
  });

  // 2. Load from Files (Legacy support or static docs)
  const fileCategories = categorySlug ? [categorySlug] : ['public', 'admin', 'lk'];
  for (const cat of fileCategories) {
    const dirPath = path.join(DOCS_PATH, cat);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const fileContent = await fs.readFile(path.join(dirPath, file), 'utf8');
          const { data } = matter(fileContent);
          // Don't duplicate if already in DB
          if (!allDocs.some(d => d.slug === file.replace('.md', ''))) {
            allDocs.push({
              ...data,
              slug: file.replace('.md', ''),
              category: cat,
              isDb: false
            } as DocMetadata);
          }
        }
      }
    } catch (e) {
      // Skip empty directories
    }
  }

  return allDocs;
}

export async function getKBCategories() {
  const prisma = getPrisma();
  return prisma.knowledgeBaseCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { articles: true } } }
  });
}
