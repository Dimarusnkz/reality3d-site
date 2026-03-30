import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const DOCS_PATH = path.join(process.cwd(), 'content/docs');

export interface DocMetadata {
  title: string;
  description?: string;
  category: 'public' | 'admin' | 'lk';
  lastUpdated: string;
  slug: string;
}

export async function getDocBySlug(category: string, slug: string) {
  try {
    const filePath = path.join(DOCS_PATH, category, `${slug}.md`);
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    
    return {
      metadata: { ...data, slug, category } as DocMetadata,
      content
    };
  } catch (e) {
    return null;
  }
}

export async function getAllDocs(category?: string): Promise<DocMetadata[]> {
  const categories = category ? [category] : ['public', 'admin', 'lk'];
  const allDocs: DocMetadata[] = [];

  for (const cat of categories) {
    const dirPath = path.join(DOCS_PATH, cat);
    try {
      const files = await fs.readdir(dirPath);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const fileContent = await fs.readFile(path.join(dirPath, file), 'utf8');
          const { data } = matter(fileContent);
          allDocs.push({
            ...data,
            slug: file.replace('.md', ''),
            category: cat as any
          } as DocMetadata);
        }
      }
    } catch (e) {
      // Skip empty directories
    }
  }

  return allDocs;
}
